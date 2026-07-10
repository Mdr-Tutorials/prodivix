import {
  createPluginDiagnostic,
  PLUGIN_DIAGNOSTIC_CODES,
  type PluginDiagnostic,
} from '#contracts/diagnostics';
import type { JsonValue } from '#contracts/generated/pluginManifest.generated';
import { appendJsonPointer } from '#contracts/jsonPointer';

export const DEFAULT_JSON_VALUE_MAX_DEPTH = 64;
export const DEFAULT_JSON_VALUE_MAX_NODES = 50_000;

export type JsonValueValidationOptions = {
  maxDepth?: number;
  maxNodes?: number;
};

export type JsonValueValidationResult =
  | {
      ok: true;
      value: JsonValue;
      diagnostics: readonly [];
    }
  | {
      ok: false;
      diagnostics: readonly PluginDiagnostic[];
    };

const valueType = (value: unknown): string => {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  return typeof value;
};

const normalizeLimit = (value: number | undefined, fallback: number): number =>
  Number.isSafeInteger(value) && (value ?? 0) > 0
    ? (value as number)
    : fallback;

const nonJsonDiagnostic = (
  manifestPath: string,
  value: unknown,
  detail: string
): PluginDiagnostic =>
  createPluginDiagnostic(
    PLUGIN_DIAGNOSTIC_CODES.NON_JSON_VALUE,
    `Value at ${manifestPath || '<root>'} is not JSON-compatible: ${detail}.`,
    {
      manifestPath,
      valueType: valueType(value),
    }
  );

export const validateJsonValue = (
  input: unknown,
  options: JsonValueValidationOptions = {}
): JsonValueValidationResult => {
  const maxDepth = normalizeLimit(
    options.maxDepth,
    DEFAULT_JSON_VALUE_MAX_DEPTH
  );
  const maxNodes = normalizeLimit(
    options.maxNodes,
    DEFAULT_JSON_VALUE_MAX_NODES
  );
  const activeObjects = new WeakSet<object>();
  let nodeCount = 0;

  const visit = (
    value: unknown,
    manifestPath: string,
    depth: number
  ): PluginDiagnostic | undefined => {
    nodeCount += 1;
    if (nodeCount > maxNodes) {
      return createPluginDiagnostic(
        PLUGIN_DIAGNOSTIC_CODES.RESOURCE_LIMIT,
        `JSON value exceeds the ${maxNodes} node limit.`,
        { manifestPath, limit: maxNodes, actual: nodeCount }
      );
    }
    if (depth > maxDepth) {
      return createPluginDiagnostic(
        PLUGIN_DIAGNOSTIC_CODES.RESOURCE_LIMIT,
        `JSON value exceeds the ${maxDepth} level depth limit.`,
        { manifestPath, limit: maxDepth, actual: depth }
      );
    }

    if (
      value === null ||
      typeof value === 'string' ||
      typeof value === 'boolean'
    ) {
      return undefined;
    }
    if (typeof value === 'number') {
      return Number.isFinite(value)
        ? undefined
        : nonJsonDiagnostic(manifestPath, value, 'numbers must be finite');
    }
    if (typeof value !== 'object') {
      return nonJsonDiagnostic(
        manifestPath,
        value,
        `${typeof value} values are not part of JSON`
      );
    }
    if (activeObjects.has(value)) {
      return nonJsonDiagnostic(manifestPath, value, 'cycles are not allowed');
    }

    const prototype = Object.getPrototypeOf(value);
    const isArray = Array.isArray(value);
    if (
      (isArray && prototype !== Array.prototype) ||
      (!isArray && prototype !== Object.prototype && prototype !== null)
    ) {
      return nonJsonDiagnostic(
        manifestPath,
        value,
        'only plain objects and arrays are allowed'
      );
    }

    activeObjects.add(value);
    try {
      const ownKeys = Reflect.ownKeys(value);
      if (ownKeys.some((key) => typeof key === 'symbol')) {
        return nonJsonDiagnostic(
          manifestPath,
          value,
          'symbol properties are not allowed'
        );
      }

      if (isArray) {
        const array = value as unknown[];
        const unexpectedKey = ownKeys.find(
          (key) =>
            key !== 'length' &&
            (typeof key !== 'string' || !/^(0|[1-9][0-9]*)$/.test(key))
        );
        if (unexpectedKey !== undefined) {
          return nonJsonDiagnostic(
            appendJsonPointer(manifestPath, String(unexpectedKey)),
            value,
            'arrays cannot have named properties'
          );
        }

        for (let index = 0; index < array.length; index += 1) {
          const itemPath = appendJsonPointer(manifestPath, index);
          const descriptor = Object.getOwnPropertyDescriptor(
            array,
            String(index)
          );
          if (!descriptor) {
            return nonJsonDiagnostic(
              itemPath,
              undefined,
              'sparse arrays are not allowed'
            );
          }
          if (!descriptor.enumerable || !('value' in descriptor)) {
            return nonJsonDiagnostic(
              itemPath,
              array,
              'array items must be enumerable data properties'
            );
          }
          const diagnostic = visit(descriptor.value, itemPath, depth + 1);
          if (diagnostic) return diagnostic;
        }
        return undefined;
      }

      for (const key of ownKeys as string[]) {
        const propertyPath = appendJsonPointer(manifestPath, key);
        const descriptor = Object.getOwnPropertyDescriptor(value, key);
        if (!descriptor?.enumerable || !('value' in descriptor)) {
          return nonJsonDiagnostic(
            propertyPath,
            value,
            'object properties must be enumerable data properties'
          );
        }
        const diagnostic = visit(descriptor.value, propertyPath, depth + 1);
        if (diagnostic) return diagnostic;
      }
      return undefined;
    } finally {
      activeObjects.delete(value);
    }
  };

  try {
    const diagnostic = visit(input, '', 0);
    return diagnostic
      ? { ok: false, diagnostics: [diagnostic] }
      : { ok: true, value: input as JsonValue, diagnostics: [] };
  } catch {
    return {
      ok: false,
      diagnostics: [
        nonJsonDiagnostic('', input, 'the value could not be inspected safely'),
      ],
    };
  }
};
