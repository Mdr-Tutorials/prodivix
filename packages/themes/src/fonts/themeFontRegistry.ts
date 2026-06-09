import type {
  ThemeFontDisplay,
  ThemeFontFace,
  ThemeFontFormat,
  ThemeFontRegistry,
  ThemeFontSource,
} from '../schema/themeManifest.types';

export const SUPPORTED_THEME_FONT_FORMATS = ['woff2', 'woff'] as const;
export const SUPPORTED_THEME_FONT_DISPLAYS = [
  'auto',
  'block',
  'swap',
  'fallback',
  'optional',
] as const;

export const MAX_THEME_FONT_FACE_COUNT = 16;
export const MAX_THEME_FONT_SOURCE_COUNT = 4;
export const MAX_THEME_FONT_SOURCE_BYTES = 2 * 1024 * 1024;

type ThemeFontRegistryIssue = {
  path: string;
  message: string;
};

export type ThemeFontRegistryValidationResult =
  | {
      valid: true;
      errors: [];
    }
  | {
      valid: false;
      errors: ThemeFontRegistryIssue[];
    };

export type CreateThemeFontFaceCssOptions = {
  resolveFontSourceUrl?: (source: ThemeFontSource) => string | undefined;
};

export const validateThemeFontRegistry = (
  value: unknown,
  path = '$.fonts'
): ThemeFontRegistryValidationResult => {
  const errors: ThemeFontRegistryIssue[] = [];

  if (!isPlainObject(value)) {
    return {
      valid: false,
      errors: [{ path, message: 'Theme fonts must be an object.' }],
    };
  }

  if (!Array.isArray(value.faces)) {
    errors.push({
      path: `${path}.faces`,
      message: 'Theme fonts.faces must be an array.',
    });
    return { valid: false, errors };
  }

  if (value.faces.length > MAX_THEME_FONT_FACE_COUNT) {
    errors.push({
      path: `${path}.faces`,
      message: `Theme fonts.faces must contain at most ${MAX_THEME_FONT_FACE_COUNT} faces.`,
    });
  }

  value.faces.forEach((face, index) => {
    validateFontFace(face, `${path}.faces[${index}]`, errors);
  });

  return errors.length === 0
    ? { valid: true, errors: [] }
    : { valid: false, errors };
};

export const createThemeFontFaceCss = (
  registry: ThemeFontRegistry | undefined,
  options: CreateThemeFontFaceCssOptions = {}
) => {
  if (!registry || registry.faces.length === 0) {
    return '';
  }

  return registry.faces
    .map((face) => createFontFaceBlock(face, options))
    .filter(Boolean)
    .join('\n\n');
};

const createFontFaceBlock = (
  face: ThemeFontFace,
  options: CreateThemeFontFaceCssOptions
) => {
  const sources = face.sources
    .map((source) => {
      const resolvedUrl = options.resolveFontSourceUrl?.(source) ?? source.url;
      if (!resolvedUrl) return undefined;

      return `url('${escapeCssString(resolvedUrl)}') format('${source.format}')`;
    })
    .filter((source): source is string => Boolean(source));

  if (sources.length === 0) {
    return '';
  }

  const declarations = [
    `  font-family: '${escapeCssString(face.family)}';`,
    `  font-style: ${face.style ?? 'normal'};`,
    `  font-display: ${face.display ?? 'swap'};`,
    face.weight ? `  font-weight: ${face.weight};` : undefined,
    face.stretch ? `  font-stretch: ${face.stretch};` : undefined,
    `  src: ${sources.join(', ')};`,
    face.unicodeRange ? `  unicode-range: ${face.unicodeRange};` : undefined,
  ].filter((line): line is string => Boolean(line));

  return `@font-face {\n${declarations.join('\n')}\n}`;
};

const validateFontFace = (
  value: unknown,
  path: string,
  errors: ThemeFontRegistryIssue[]
) => {
  if (!isPlainObject(value)) {
    errors.push({ path, message: 'Theme font face must be an object.' });
    return;
  }

  validateSafeString(value.family, `${path}.family`, errors, {
    required: true,
    maxLength: 80,
    pattern: /^[a-zA-Z0-9 ._-]+$/,
    message:
      'Theme font family must contain only letters, numbers, spaces, dots, underscores, or hyphens.',
  });

  validateSafeString(value.style, `${path}.style`, errors, {
    maxLength: 24,
    pattern: /^(normal|italic|oblique(?: -?\d+deg(?: -?\d+deg)?)?)$/,
    message:
      'Theme font style must be normal, italic, or a safe oblique value.',
  });

  if (
    value.display !== undefined &&
    !SUPPORTED_THEME_FONT_DISPLAYS.includes(value.display as ThemeFontDisplay)
  ) {
    errors.push({
      path: `${path}.display`,
      message:
        'Theme font display must be auto, block, swap, fallback, or optional.',
    });
  }

  validateSafeString(value.weight, `${path}.weight`, errors, {
    maxLength: 16,
    pattern: /^([1-9]00|[1-9]00 [1-9]00|normal|bold)$/,
    message:
      'Theme font weight must be normal, bold, a 100-900 value, or a safe 100-900 range.',
  });

  validateSafeString(value.stretch, `${path}.stretch`, errors, {
    maxLength: 24,
    pattern: /^(\d{1,3}(?:\.\d+)?%|\d{1,3}(?:\.\d+)?% \d{1,3}(?:\.\d+)?%)$/,
    message: 'Theme font stretch must be a percentage or percentage range.',
  });

  validateSafeString(value.unicodeRange, `${path}.unicodeRange`, errors, {
    maxLength: 600,
    pattern:
      /^U\+[0-9A-F?]{1,6}(?:-[0-9A-F]{1,6})?(?:,\s*U\+[0-9A-F?]{1,6}(?:-[0-9A-F]{1,6})?)*$/i,
    message: 'Theme font unicodeRange must use CSS unicode-range syntax.',
  });

  if (!Array.isArray(value.sources)) {
    errors.push({
      path: `${path}.sources`,
      message: 'Theme font face sources must be an array.',
    });
    return;
  }

  if (value.sources.length === 0) {
    errors.push({
      path: `${path}.sources`,
      message: 'Theme font face must include at least one source.',
    });
  }

  if (value.sources.length > MAX_THEME_FONT_SOURCE_COUNT) {
    errors.push({
      path: `${path}.sources`,
      message: `Theme font face sources must contain at most ${MAX_THEME_FONT_SOURCE_COUNT} entries.`,
    });
  }

  value.sources.forEach((source, index) => {
    validateFontSource(source, `${path}.sources[${index}]`, errors);
  });
};

const validateFontSource = (
  value: unknown,
  path: string,
  errors: ThemeFontRegistryIssue[]
) => {
  if (!isPlainObject(value)) {
    errors.push({ path, message: 'Theme font source must be an object.' });
    return;
  }

  if (
    value.format === undefined ||
    !SUPPORTED_THEME_FONT_FORMATS.includes(value.format as ThemeFontFormat)
  ) {
    errors.push({
      path: `${path}.format`,
      message: 'Theme font source format must be woff2 or woff.',
    });
  }

  if (typeof value.url !== 'string' || value.url.trim() === '') {
    errors.push({
      path: `${path}.url`,
      message: 'Theme font source url must be a non-empty string.',
    });
  } else if (!isSafeFontSourceUrl(value.url)) {
    errors.push({
      path: `${path}.url`,
      message:
        'Theme font source url must be a local, asset, @fontsource, data:font, or https URL ending in .woff2 or .woff.',
    });
  }

  const bytes = value.bytes;
  if (
    bytes !== undefined &&
    (typeof bytes !== 'number' ||
      !Number.isInteger(bytes) ||
      bytes < 1 ||
      bytes > MAX_THEME_FONT_SOURCE_BYTES)
  ) {
    errors.push({
      path: `${path}.bytes`,
      message: `Theme font source bytes must be an integer from 1 to ${MAX_THEME_FONT_SOURCE_BYTES}.`,
    });
  }
};

const validateSafeString = (
  value: unknown,
  path: string,
  errors: ThemeFontRegistryIssue[],
  options: {
    required?: boolean;
    maxLength: number;
    pattern: RegExp;
    message: string;
  }
) => {
  if (value === undefined) {
    if (options.required) {
      errors.push({ path, message: 'Theme font field is required.' });
    }
    return;
  }

  if (
    typeof value !== 'string' ||
    value.trim() === '' ||
    value.length > options.maxLength ||
    !options.pattern.test(value)
  ) {
    errors.push({ path, message: options.message });
  }
};

export const isSafeFontSourceUrl = (value: string) => {
  const normalized = value.trim();
  const withoutQuery = normalized.split(/[?#]/, 1)[0].toLowerCase();
  const hasSupportedExtension =
    withoutQuery.endsWith('.woff2') || withoutQuery.endsWith('.woff');

  if (!hasSupportedExtension) {
    return (
      normalized.startsWith('data:font/woff2;') ||
      normalized.startsWith('data:font/woff;')
    );
  }

  if (
    normalized.startsWith('./') ||
    normalized.startsWith('../') ||
    normalized.startsWith('/') ||
    normalized.startsWith('asset:') ||
    normalized.startsWith('https://')
  ) {
    return true;
  }

  return (
    normalized.startsWith('@fontsource/') ||
    normalized.startsWith('@fontsource-variable/') ||
    normalized.startsWith('@lobehub/webfont-')
  );
};

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

const escapeCssString = (value: string) => {
  return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
};
