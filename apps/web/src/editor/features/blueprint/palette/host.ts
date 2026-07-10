import {
  createPluginDiagnostic,
  PLUGIN_DIAGNOSTIC_CODES,
  validatePaletteContribution,
  type JsonValue,
  type PaletteContributionV1,
  type PluginManifestV1,
} from '@prodivix/plugin-contracts';
import {
  asNonEmptyDiagnostics,
  createPluginHost,
  pluginHostFailure,
  pluginHostSuccess,
  resolvePermissionSnapshot,
  type ContributionRegistryReader,
  type PluginAuditEvent,
  type PluginHost,
  type PluginHostResult,
  type PluginHostSnapshot,
  type PluginPackageSource,
} from '@prodivix/plugin-host';
import type { ComponentGroup } from '@/editor/features/blueprint/editor/model/types';
import { createPaletteProjectionResolver } from '@/editor/features/blueprint/palette/projectionResolver';
import type { BlueprintContributionPointMap } from '@/editor/features/blueprint/palette/types';

const BLUEPRINT_PLUGIN_HOST_VERSION = '0.1.0';
const MAX_PALETTE_AUDIT_EVENTS = 1_000;
const encoder = new TextEncoder();
const paletteProjectionResolver = createPaletteProjectionResolver();
const paletteAuditEvents: PluginAuditEvent[] = [];
let generatedId = 0;

const hostResult = createPluginHost<BlueprintContributionPointMap>({
  hostVersion: BLUEPRINT_PLUGIN_HOST_VERSION,
  contracts: [paletteProjectionResolver.contract],
  capabilityPolicy: {
    resolve: async (input) =>
      resolvePermissionSnapshot({
        owner: input.owner,
        pluginVersion: input.manifest.version,
        requests: input.manifest.capabilities,
        decisions: input.manifest.capabilities.map((request) => ({
          capability:
            'scope' in request
              ? { id: request.id, scope: request.scope }
              : { id: request.id },
          decision: input.attestation.trustLevel === 'core' ? 'grant' : 'deny',
          source: 'host-safety',
          reasonCode:
            input.attestation.trustLevel === 'core'
              ? 'trusted-core-contribution'
              : 'phase3-trusted-source-only',
        })),
        permissionRevision: input.nextPermissionRevision,
        policyRevision: 'blueprint-palette-phase3-v1',
        policySource: 'blueprint-palette-host',
      }),
  },
  runtimeAdapter: {
    activate: async (input) =>
      pluginHostFailure([
        createPluginDiagnostic(
          PLUGIN_DIAGNOSTIC_CODES.RUNTIME_ACTIVATION_FAILED,
          'Blueprint Palette Phase 3 does not execute plugin runtimes.',
          { pluginId: input.owner.pluginId }
        ),
      ]),
  },
  auditSink: {
    append: async (events) => {
      paletteAuditEvents.push(...events);
      if (paletteAuditEvents.length > MAX_PALETTE_AUDIT_EVENTS) {
        paletteAuditEvents.splice(
          0,
          paletteAuditEvents.length - MAX_PALETTE_AUDIT_EVENTS
        );
      }
      return pluginHostSuccess(undefined);
    },
  },
  clock: { now: () => new Date().toISOString() },
  idFactory: {
    createId: (kind) => {
      generatedId += 1;
      return `palette-${kind}-${generatedId}`;
    },
  },
});

if (!hostResult.ok) {
  throw new Error(
    `Blueprint Palette Host configuration failed: ${hostResult.diagnostics
      .map((diagnostic) => diagnostic.code)
      .join(', ')}`
  );
}

const paletteHost: PluginHost<BlueprintContributionPointMap> = hostResult.value;
const operationTails = new Map<string, Promise<void>>();

const runSerialized = <T>(
  pluginId: string,
  operation: () => Promise<T>
): Promise<T> => {
  const previous = operationTails.get(pluginId) ?? Promise.resolve();
  const current = previous.catch(() => undefined).then(operation);
  const tail = current.then(
    () => undefined,
    () => undefined
  );
  operationTails.set(pluginId, tail);
  return current.finally(() => {
    if (operationTails.get(pluginId) === tail) operationTails.delete(pluginId);
  });
};

const createManifest = (input: TrustedPaletteContributionInput) =>
  ({
    schemaVersion: '1.0',
    id: input.pluginId,
    displayName: input.displayName,
    version: input.version,
    publisher: 'prodivix',
    engines: { prodivix: '>=0.1.0 <1.0.0' },
    capabilities: [
      {
        id: 'extension.register',
        scope: 'paletteContribution',
        reason: 'Register trusted Blueprint component palette entries.',
      },
    ],
    contributes: [
      {
        id: input.contributionId,
        point: 'paletteContribution',
        contractVersion: '1.0',
        source: {
          kind: 'inline',
          descriptor: input.descriptor as unknown as Record<string, JsonValue>,
        },
        metadata: {
          displayName: input.displayName,
          order: input.order ?? 0,
        },
      },
    ],
  }) satisfies PluginManifestV1;

const createPackageSource = (
  input: TrustedPaletteContributionInput,
  manifest: PluginManifestV1
): PluginPackageSource => {
  const manifestBytes = encoder.encode(JSON.stringify(manifest));
  return Object.freeze({
    installationId: input.installationId,
    attestation: Object.freeze({
      sourceId: `trusted-memory:${input.pluginId}`,
      packageDigest: `trusted-memory:${input.version}:${manifestBytes.byteLength}`,
      trustLevel: 'core' as const,
      publisherVerified: true,
    }),
    reader: Object.freeze({
      readManifest: async () =>
        pluginHostSuccess(new Uint8Array(manifestBytes)),
      readResource: async () =>
        pluginHostFailure([
          createPluginDiagnostic(
            PLUGIN_DIAGNOSTIC_CODES.CONTRIBUTION_RESOURCE_READ_FAILED,
            'Trusted Palette contributions only use inline descriptors.',
            { pluginId: input.pluginId }
          ),
        ]),
    }),
  });
};

export type TrustedPaletteContributionInput = Readonly<{
  pluginId: string;
  displayName: string;
  version: string;
  installationId: string;
  contributionId: string;
  descriptor: PaletteContributionV1;
  groups: readonly ComponentGroup[];
  order?: number;
}>;

export const registerTrustedPaletteContribution = (
  input: TrustedPaletteContributionInput
): Promise<PluginHostResult<PluginHostSnapshot>> =>
  runSerialized(input.pluginId, async () => {
    const validation = validatePaletteContribution(input.descriptor);
    if (!validation.ok) {
      return pluginHostFailure(
        asNonEmptyDiagnostics(validation.diagnostics) ?? [
          createPluginDiagnostic(
            PLUGIN_DIAGNOSTIC_CODES.CONTRIBUTION_SCHEMA_VIOLATION,
            'Palette descriptor validation failed without a diagnostic.',
            {
              pluginId: input.pluginId,
              contributionId: input.contributionId,
            }
          ),
        ]
      );
    }
    const binding = paletteProjectionResolver.bindProjection({
      pluginId: input.pluginId,
      contributionId: input.contributionId,
      projection: { groups: input.groups },
    });
    try {
      const manifest = createManifest({
        ...input,
        descriptor: validation.descriptor,
      });
      return await paletteHost.discover(createPackageSource(input, manifest));
    } finally {
      binding.dispose();
    }
  });

export const disableTrustedPalettePlugin = (
  pluginId: string
): Promise<PluginHostResult<void>> =>
  runSerialized(pluginId, async () => {
    if (!paletteHost.getSnapshot(pluginId)) return pluginHostSuccess(undefined);
    const result = await paletteHost.disable(pluginId);
    return result.ok
      ? pluginHostSuccess(undefined, result.diagnostics)
      : result;
  });

export const getPaletteContributionReader =
  (): ContributionRegistryReader<BlueprintContributionPointMap> =>
    paletteHost.contributions;

export const getPaletteAuditEvents = (): readonly PluginAuditEvent[] =>
  Object.freeze([...paletteAuditEvents]);
