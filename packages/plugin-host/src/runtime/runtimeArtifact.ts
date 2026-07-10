import {
  createPluginDiagnostic,
  PLUGIN_DIAGNOSTIC_CODES,
  type Artifact,
} from '@prodivix/plugin-contracts';
import type { PluginResourceIntegrityService } from '#host/contribution/resourceIntegrity';
import type { PluginOwnerRef } from '#host/identity';
import type {
  PluginPackageAttestation,
  PluginPackageReader,
} from '#host/host.types';
import {
  pluginHostFailure,
  pluginHostSuccess,
  type PluginHostResult,
} from '#host/result';

export type PluginRuntimeArtifactLimits = Readonly<{
  maxBytes: number;
}>;

export const DEFAULT_PLUGIN_RUNTIME_ARTIFACT_LIMITS: PluginRuntimeArtifactLimits =
  Object.freeze({ maxBytes: 8 * 1024 * 1024 });

export type VerifiedPluginRuntimeArtifact = Readonly<{
  path: string;
  bytes: Uint8Array;
  digest: string;
  declaredIntegrity?: string;
  packageDigest: string;
}>;

type RuntimeArtifactLoadContext = Readonly<{
  owner: PluginOwnerRef;
  pluginVersion: string;
  artifact: Artifact;
  attestation: PluginPackageAttestation;
  reader: PluginPackageReader;
  integrityService: PluginResourceIntegrityService;
  limits: PluginRuntimeArtifactLimits;
  operationId: string;
  signal: AbortSignal;
}>;

const SHA256_INTEGRITY_PATTERN = /^sha256-[A-Za-z0-9+/]{43}=$/;

const normalizePositiveLimit = (value: number, fallback: number): number =>
  Number.isSafeInteger(value) && value > 0 ? value : fallback;

export const normalizeRuntimeArtifactLimits = (
  input: Partial<PluginRuntimeArtifactLimits> = {}
): PluginRuntimeArtifactLimits =>
  Object.freeze({
    maxBytes: normalizePositiveLimit(
      input.maxBytes ?? 0,
      DEFAULT_PLUGIN_RUNTIME_ARTIFACT_LIMITS.maxBytes
    ),
  });

const artifactMeta = (context: RuntimeArtifactLoadContext) => ({
  pluginId: context.owner.pluginId,
  pluginVersion: context.pluginVersion,
  installationId: context.owner.installationId,
  generation: context.owner.generation,
  operationId: context.operationId,
  resourcePath: context.artifact.path,
});

export const loadVerifiedRuntimeArtifact = async (
  context: RuntimeArtifactLoadContext
): Promise<PluginHostResult<VerifiedPluginRuntimeArtifact>> => {
  let readResult: Awaited<ReturnType<PluginPackageReader['readResource']>>;
  try {
    readResult = await context.reader.readResource(context.artifact.path, {
      maxBytes: context.limits.maxBytes,
      signal: context.signal,
    });
  } catch {
    return pluginHostFailure([
      createPluginDiagnostic(
        PLUGIN_DIAGNOSTIC_CODES.RUNTIME_ARTIFACT_READ_FAILED,
        `Runtime artifact ${JSON.stringify(context.artifact.path)} could not be read.`,
        artifactMeta(context)
      ),
    ]);
  }
  if (!readResult.ok) {
    return pluginHostFailure([
      createPluginDiagnostic(
        PLUGIN_DIAGNOSTIC_CODES.RUNTIME_ARTIFACT_READ_FAILED,
        `Runtime artifact ${JSON.stringify(context.artifact.path)} could not be read.`,
        artifactMeta(context)
      ),
      ...readResult.diagnostics,
    ]);
  }

  const bytes = new Uint8Array(readResult.value);
  if (bytes.byteLength > context.limits.maxBytes) {
    return pluginHostFailure([
      createPluginDiagnostic(
        PLUGIN_DIAGNOSTIC_CODES.RUNTIME_ARTIFACT_LIMIT,
        `Runtime artifact exceeds the ${context.limits.maxBytes} byte limit.`,
        {
          ...artifactMeta(context),
          limit: context.limits.maxBytes,
          actual: bytes.byteLength,
        }
      ),
    ]);
  }

  let digest: string;
  try {
    digest = await context.integrityService.digestSha256(bytes, context.signal);
  } catch {
    return pluginHostFailure([
      createPluginDiagnostic(
        PLUGIN_DIAGNOSTIC_CODES.RUNTIME_ARTIFACT_INTEGRITY_MISMATCH,
        `Runtime artifact ${JSON.stringify(context.artifact.path)} digest could not be computed.`,
        artifactMeta(context)
      ),
    ]);
  }
  if (!SHA256_INTEGRITY_PATTERN.test(digest)) {
    return pluginHostFailure([
      createPluginDiagnostic(
        PLUGIN_DIAGNOSTIC_CODES.RUNTIME_ARTIFACT_INTEGRITY_MISMATCH,
        'Runtime artifact digest service returned an invalid SHA-256 integrity value.',
        artifactMeta(context)
      ),
    ]);
  }
  if (context.artifact.integrity && context.artifact.integrity !== digest) {
    return pluginHostFailure([
      createPluginDiagnostic(
        PLUGIN_DIAGNOSTIC_CODES.RUNTIME_ARTIFACT_INTEGRITY_MISMATCH,
        `Runtime artifact ${JSON.stringify(context.artifact.path)} does not match its declared integrity.`,
        artifactMeta(context)
      ),
    ]);
  }

  return pluginHostSuccess(
    Object.freeze({
      path: context.artifact.path,
      bytes,
      digest,
      declaredIntegrity: context.artifact.integrity,
      packageDigest: context.attestation.packageDigest,
    }),
    readResult.diagnostics
  );
};
