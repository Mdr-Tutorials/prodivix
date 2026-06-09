import { CURRENT_THEME_SCHEMA_VERSION } from '../schema/themeManifest.types';
import type {
  ThemeManifest,
  ThemeTokenPath,
  ThemeValidationIssue,
  ThemeValidationResult,
} from '../schema/themeManifest.types';
import { detectTokenCycles } from '../resolver/detectTokenCycles';
import { resolveTokenReferences } from '../resolver/resolveTokenReferences';
import {
  flattenThemeTokens,
  isThemeTokenPrimitive,
  isThemeTokenTree,
} from '../tokens/tokenPaths';
import { defaultFallbackTheme } from '../tokens/defaultFallback';
import { validateThemeFontRegistry } from '../fonts/themeFontRegistry';

const THEME_ID_PATTERN = /^[a-z][a-z0-9]*(\.[a-z0-9][a-z0-9-]*)+$/;

export type ValidateThemeManifestOptions = {
  fallbackManifest?: ThemeManifest;
};

export const validateThemeManifest = (
  input: unknown,
  options: ValidateThemeManifestOptions = {}
): ThemeValidationResult => {
  const errors: ThemeValidationIssue[] = [];

  if (!isPlainObject(input)) {
    return {
      valid: false,
      errors: [{ path: '$', message: 'Theme manifest must be an object.' }],
    };
  }

  validateRequiredString(input, 'schemaVersion', errors);
  validateRequiredString(input, 'id', errors);
  validateRequiredString(input, 'name', errors);
  validateRequiredString(input, 'source', errors);
  validateRequiredString(input, 'mode', errors);

  if (input.schemaVersion !== CURRENT_THEME_SCHEMA_VERSION) {
    errors.push({
      path: '$.schemaVersion',
      message: `Theme manifest schemaVersion must be "${CURRENT_THEME_SCHEMA_VERSION}".`,
    });
  }

  if (typeof input.id === 'string' && !THEME_ID_PATTERN.test(input.id)) {
    errors.push({
      path: '$.id',
      message: 'Theme id must use a stable dot-separated identifier.',
    });
  }

  if (!['official', 'custom', 'community'].includes(String(input.source))) {
    errors.push({
      path: '$.source',
      message: 'Theme source must be official, custom, or community.',
    });
  }

  if (!['light', 'dark', 'adaptive'].includes(String(input.mode))) {
    errors.push({
      path: '$.mode',
      message: 'Theme mode must be light, dark, or adaptive.',
    });
  }

  if (input.palette !== undefined) {
    errors.push({
      path: '$.palette',
      message:
        'Theme manifests must not define palette; the palette is fixed and shared.',
    });
  }

  validateTokenTree(input.semantic, '$.semantic', errors);

  for (const optionalSection of [
    'product',
    'typography',
    'radius',
    'shadow',
    'density',
    'motion',
  ]) {
    if (input[optionalSection] !== undefined) {
      validateTokenTree(input[optionalSection], `$.${optionalSection}`, errors);
    }
  }

  if (input.fonts !== undefined) {
    const fontValidation = validateThemeFontRegistry(input.fonts);

    if (!fontValidation.valid) {
      errors.push(...fontValidation.errors);
    }
  }

  if (errors.length > 0) {
    return {
      valid: false,
      errors,
    };
  }

  const manifest = input as ThemeManifest;
  const fallbackManifest = options.fallbackManifest ?? defaultFallbackTheme;
  const rawTokens = flattenThemeTokens(manifest);
  const fallbackTokens =
    fallbackManifest.id === manifest.id
      ? {}
      : flattenThemeTokens(fallbackManifest);
  const cycles = detectTokenCycles(rawTokens, fallbackTokens);

  for (const cycle of cycles) {
    errors.push({
      path: tokenPathToIssuePath(cycle.path),
      message: `Circular theme token reference detected: ${cycle.chain.join(' -> ')}.`,
    });
  }

  try {
    resolveTokenReferences(rawTokens, fallbackTokens);
  } catch (error) {
    errors.push({
      path: '$',
      message:
        error instanceof Error
          ? error.message
          : 'Failed to resolve theme tokens.',
    });
  }

  return errors.length === 0
    ? { valid: true, errors: [] }
    : {
        valid: false,
        errors,
      };
};

const validateRequiredString = (
  input: Record<string, unknown>,
  key: string,
  errors: ThemeValidationIssue[]
) => {
  if (typeof input[key] !== 'string' || input[key] === '') {
    errors.push({
      path: `$.${key}`,
      message: `${key} is required and must be a non-empty string.`,
    });
  }
};

const validateTokenTree = (
  value: unknown,
  path: string,
  errors: ThemeValidationIssue[]
) => {
  if (!isThemeTokenTree(value)) {
    errors.push({
      path,
      message: 'Theme token section must be an object.',
    });
    return;
  }

  for (const [key, childValue] of Object.entries(value)) {
    const childPath = `${path}.${key}`;

    if (isThemeTokenPrimitive(childValue)) {
      continue;
    }

    if (isThemeTokenTree(childValue)) {
      validateTokenTree(childValue, childPath, errors);
      continue;
    }

    errors.push({
      path: childPath,
      message: 'Theme token value must be a string, number, or nested object.',
    });
  }
};

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

const tokenPathToIssuePath = (path: ThemeTokenPath) => {
  return `$.${path}`;
};
