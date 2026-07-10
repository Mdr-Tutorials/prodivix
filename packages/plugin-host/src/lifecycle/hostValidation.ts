import {
  createPluginDiagnostic,
  parseAndValidatePluginManifest,
  PLUGIN_DIAGNOSTIC_CODES,
  type PluginManifestV1,
} from '@prodivix/plugin-contracts';
import {
  normalizePolicySnapshot,
  type CapabilityPolicy,
  type CapabilityPolicyInput,
} from '#host/capability/capabilityPolicy';
import type { PermissionSnapshot } from '#host/capability/permissionSnapshot';
import type { PluginPackageSource } from '#host/host.types';
import {
  asNonEmptyDiagnostics,
  pluginHostFailure,
  pluginHostSuccess,
  type PluginHostResult,
} from '#host/result';

const trustLevels = new Set([
  'core',
  'official',
  'verified',
  'community',
  'development',
]);

const invalidSource = (
  source: PluginPackageSource,
  message: string
): PluginHostResult<PluginManifestV1> =>
  pluginHostFailure([
    createPluginDiagnostic(PLUGIN_DIAGNOSTIC_CODES.INVALID_SOURCE, message, {
      installationId: source.installationId,
    }),
  ]);

const isValidPackageSource = (source: PluginPackageSource): boolean =>
  Boolean(
    source.installationId.trim() &&
    source.attestation.sourceId.trim() &&
    source.attestation.packageDigest.trim() &&
    trustLevels.has(source.attestation.trustLevel) &&
    source.reader &&
    typeof source.reader.readManifest === 'function' &&
    typeof source.reader.readResource === 'function'
  );

export const readAndValidatePluginManifest = async (
  source: PluginPackageSource,
  options: Readonly<{
    hostVersion: string;
    knownCommandIds?: readonly string[];
    signal: AbortSignal;
  }>
): Promise<PluginHostResult<PluginManifestV1>> => {
  if (!isValidPackageSource(source)) {
    return invalidSource(
      source,
      'Plugin package source is incomplete or invalid.'
    );
  }
  try {
    const readResult = await source.reader.readManifest(options.signal);
    if (!readResult.ok) return readResult;
    const parsed = parseAndValidatePluginManifest(
      new Uint8Array(readResult.value),
      {
        hostVersion: options.hostVersion,
        knownCommandIds: options.knownCommandIds,
      }
    );
    if (!parsed.ok) {
      const diagnostics = asNonEmptyDiagnostics(parsed.diagnostics);
      return diagnostics
        ? pluginHostFailure(diagnostics)
        : invalidSource(
            source,
            'Plugin Manifest validation failed without a diagnostic.'
          );
    }
    return pluginHostSuccess(parsed.manifest, readResult.diagnostics);
  } catch {
    return invalidSource(source, 'Plugin Manifest could not be read safely.');
  }
};

export const resolveHostPermission = async (
  policy: CapabilityPolicy,
  input: CapabilityPolicyInput,
  signal: AbortSignal
): Promise<PluginHostResult<PermissionSnapshot>> => {
  try {
    const result = await policy.resolve(input, signal);
    if (!result.ok) return result;
    const normalized = normalizePolicySnapshot(input, result.value);
    if (!normalized.ok) return normalized;
    return pluginHostSuccess(normalized.value, [
      ...result.diagnostics,
      ...normalized.diagnostics,
    ]);
  } catch {
    return pluginHostFailure([
      createPluginDiagnostic(
        PLUGIN_DIAGNOSTIC_CODES.CAPABILITY_POLICY_FAILED,
        'Capability policy failed unexpectedly.',
        {
          pluginId: input.owner.pluginId,
          pluginVersion: input.manifest.version,
          installationId: input.owner.installationId,
          generation: input.owner.generation,
          permissionRevision: input.nextPermissionRevision,
        }
      ),
    ]);
  }
};
