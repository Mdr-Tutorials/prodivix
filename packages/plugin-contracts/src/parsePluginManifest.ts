import type { PluginDiagnostic } from '#contracts/diagnostics';
import type { JsonValue } from '#contracts/generated/pluginManifest.generated';
import type { JsonValueValidationOptions } from '#contracts/jsonValue';
import {
  DEFAULT_STRICT_JSON_MAX_BYTES,
  parseStrictJsonDocument,
} from '#contracts/parseStrictJsonDocument';

export const DEFAULT_PLUGIN_MANIFEST_MAX_BYTES = DEFAULT_STRICT_JSON_MAX_BYTES;

export type ParsePluginManifestOptions = JsonValueValidationOptions & {
  maxBytes?: number;
};

export type ParsePluginManifestResult =
  | {
      ok: true;
      value: JsonValue;
      sourceBytes: Uint8Array;
      diagnostics: readonly [];
    }
  | {
      ok: false;
      diagnostics: readonly PluginDiagnostic[];
    };

export const parsePluginManifest = (
  source: string | Uint8Array,
  options: ParsePluginManifestOptions = {}
): ParsePluginManifestResult =>
  parseStrictJsonDocument(source, {
    ...options,
    documentKind: 'manifest',
  });
