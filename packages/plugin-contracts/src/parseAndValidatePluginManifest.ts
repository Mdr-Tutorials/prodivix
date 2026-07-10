import type { PluginDiagnostic } from '#contracts/diagnostics';
import {
  parsePluginManifest,
  type ParsePluginManifestOptions,
} from '#contracts/parsePluginManifest';
import {
  validatePluginManifest,
  type ValidatePluginManifestOptions,
} from '#contracts/validatePluginManifest';
import type { PluginManifestV1 } from '#contracts/generated/pluginManifest.generated';

export type ParseAndValidatePluginManifestOptions = ParsePluginManifestOptions &
  ValidatePluginManifestOptions;

export type ParseAndValidatePluginManifestResult =
  | {
      ok: true;
      manifest: PluginManifestV1;
      sourceBytes: Uint8Array;
      diagnostics: readonly [];
    }
  | {
      ok: false;
      diagnostics: readonly PluginDiagnostic[];
    };

export const parseAndValidatePluginManifest = (
  source: string | Uint8Array,
  options: ParseAndValidatePluginManifestOptions = {}
): ParseAndValidatePluginManifestResult => {
  const parseResult = parsePluginManifest(source, options);
  if (!parseResult.ok) return parseResult;

  const validationResult = validatePluginManifest(parseResult.value, options);
  if (!validationResult.ok) return validationResult;

  return {
    ok: true,
    manifest: validationResult.manifest,
    sourceBytes: parseResult.sourceBytes,
    diagnostics: [],
  };
};
