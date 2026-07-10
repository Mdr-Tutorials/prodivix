import {
  createPluginDiagnostic,
  PLUGIN_DIAGNOSTIC_CODES,
  validatePaletteContribution,
  type JsonValue,
  type PluginDiagnostic,
} from '@prodivix/plugin-contracts';
import {
  asNonEmptyDiagnostics,
  createPluginHost,
  createSha256ResourceIntegrityService,
  pluginHostFailure,
  pluginHostSuccess,
  resolvePermissionSnapshot,
  type CapabilityPolicy,
  type PluginAuditSink,
  type PluginClock,
  type PluginHostResult,
  type PluginHostSnapshot,
  type PluginIdFactory,
  type PluginResourceIntegrityService,
  type PluginRuntimeAdapter,
  type RegisteredContributionContract,
} from '@prodivix/plugin-host';
import { createPaletteProjectionResolver } from '@/editor/features/blueprint/palette/projectionResolver';
import { createPaletteQueryService } from '@/plugins/platform/paletteQueryService';
import { createPluginAuditJournal } from '@/plugins/platform/pluginAuditJournal';
import { createTrustedPackageSource } from '@/plugins/platform/trustedPackageSource';
import type {
  TrustedPaletteContributionInput,
  WebContributionPointMap,
  WebPluginPlatform,
} from '@/plugins/platform/types';

const WEB_PLUGIN_HOST_VERSION = '0.1.0';

const createUnavailableRuntimeAdapter =
  (): PluginRuntimeAdapter<WebContributionPointMap> =>
    Object.freeze({
      activate: async (input) =>
        pluginHostFailure([
          createPluginDiagnostic(
            PLUGIN_DIAGNOSTIC_CODES.RUNTIME_ACTIVATION_FAILED,
            'This Web Plugin Platform has no Browser runtime adapter.',
            { pluginId: input.owner.pluginId }
          ),
        ]),
    });

const createDefaultCapabilityPolicy = (): CapabilityPolicy => ({
  resolve: async (input) => {
    const trusted =
      input.attestation.trustLevel === 'core' ||
      input.attestation.trustLevel === 'official';
    return resolvePermissionSnapshot({
      owner: input.owner,
      pluginVersion: input.manifest.version,
      requests: input.manifest.capabilities,
      decisions: input.manifest.capabilities.map((request) => ({
        capability:
          'scope' in request
            ? { id: request.id, scope: request.scope }
            : { id: request.id },
        decision: trusted ? 'grant' : 'deny',
        source: 'host-safety',
        reasonCode: trusted
          ? 'trusted-web-plugin-package'
          : 'web-plugin-trust-level-denied',
      })),
      permissionRevision: input.nextPermissionRevision,
      policyRevision: 'web-plugin-platform-v1',
      policySource: 'web-plugin-platform',
    });
  },
});

export type CreateWebPluginPlatformOptions = Readonly<{
  workspaceId: string;
  contracts?: readonly RegisteredContributionContract<WebContributionPointMap>[];
  runtimeAdapter?: PluginRuntimeAdapter<WebContributionPointMap>;
  capabilityPolicy?: CapabilityPolicy;
  auditSink?: PluginAuditSink;
  integrityService?: PluginResourceIntegrityService;
  clock?: PluginClock;
  idFactory?: PluginIdFactory;
  onShutdown?: () => void | Promise<void>;
}>;

export const createWebPluginPlatform = (
  options: CreateWebPluginPlatformOptions
): PluginHostResult<WebPluginPlatform> => {
  const workspaceId = options.workspaceId.trim();
  if (!workspaceId) {
    return pluginHostFailure([
      createPluginDiagnostic(
        PLUGIN_DIAGNOSTIC_CODES.INVALID_HOST_TRANSITION,
        'Web Plugin Platform requires a non-empty workspace identity.'
      ),
    ]);
  }

  let generatedId = 0;
  const nextId = (kind: string) => {
    generatedId += 1;
    return `web-plugin-${workspaceId}-${kind}-${generatedId}`;
  };
  const idFactory: PluginIdFactory =
    options.idFactory ??
    Object.freeze({
      createId: (kind) => nextId(kind),
    });
  const integrityService =
    options.integrityService ?? createSha256ResourceIntegrityService();
  const auditJournal = createPluginAuditJournal();
  const paletteResolver = createPaletteProjectionResolver();
  const hostResult = createPluginHost<WebContributionPointMap>({
    hostVersion: WEB_PLUGIN_HOST_VERSION,
    contracts: [paletteResolver.contract, ...(options.contracts ?? [])],
    capabilityPolicy:
      options.capabilityPolicy ?? createDefaultCapabilityPolicy(),
    runtimeAdapter: options.runtimeAdapter ?? createUnavailableRuntimeAdapter(),
    auditSink: options.auditSink ?? auditJournal.sink,
    integrityService,
    clock: options.clock ?? { now: () => new Date().toISOString() },
    idFactory,
  });
  if (hostResult.ok === false) {
    return pluginHostFailure(hostResult.diagnostics);
  }
  const host = hostResult.value;
  const paletteQuery = createPaletteQueryService(host.contributions);

  const install = async (
    input: Parameters<WebPluginPlatform['runtime']['packages']['install']>[0],
    signal = new AbortController().signal
  ): Promise<PluginHostResult<PluginHostSnapshot>> => {
    const sourceResult = await createTrustedPackageSource(input, {
      sourceId: nextId('package-source'),
      integrityService,
      signal,
    });
    if (sourceResult.ok === false) {
      return pluginHostFailure(sourceResult.diagnostics);
    }
    if (signal.aborted) {
      return pluginHostFailure([
        createPluginDiagnostic(
          PLUGIN_DIAGNOSTIC_CODES.OPERATION_SUPERSEDED,
          'Trusted plugin package installation was canceled before discovery.',
          { pluginId: input.pluginId }
        ),
      ]);
    }

    const missingPaletteProjection = input.contributions.find(
      (contribution) =>
        contribution.point === 'paletteContribution' &&
        !contribution.paletteProjection
    );
    if (missingPaletteProjection) {
      return pluginHostFailure([
        createPluginDiagnostic(
          PLUGIN_DIAGNOSTIC_CODES.CONTRIBUTION_RESOLVER_FAILED,
          'Trusted Palette contribution requires a runtime projection.',
          {
            pluginId: input.pluginId,
            contributionId: missingPaletteProjection.id,
            contributionPoint: missingPaletteProjection.point,
            contractVersion: missingPaletteProjection.contractVersion,
          }
        ),
      ]);
    }

    const bindings: Array<Readonly<{ dispose(): void }>> = [];
    for (const contribution of input.contributions) {
      if (
        contribution.point !== 'paletteContribution' ||
        !contribution.paletteProjection
      ) {
        continue;
      }
      bindings.push(
        paletteResolver.bindProjection({
          packageSourceId: sourceResult.value.source.attestation.sourceId,
          packageDigest: sourceResult.value.source.attestation.packageDigest,
          pluginId: input.pluginId,
          contributionId: contribution.id,
          projection: contribution.paletteProjection,
        })
      );
    }

    try {
      return await host.discover(sourceResult.value.source);
    } finally {
      [...bindings].reverse().forEach((binding) => binding.dispose());
    }
  };

  const disable = async (pluginId: string) => {
    if (!host.getSnapshot(pluginId)) return pluginHostSuccess(undefined);
    const result = await host.disable(pluginId);
    return result.ok
      ? pluginHostSuccess(undefined, result.diagnostics)
      : result;
  };

  const installPalette = (
    input: TrustedPaletteContributionInput,
    signal?: AbortSignal
  ) => {
    const validation = validatePaletteContribution(input.descriptor);
    if (!validation.ok) {
      return Promise.resolve(
        pluginHostFailure(
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
        )
      );
    }
    return install(
      {
        pluginId: input.pluginId,
        displayName: input.displayName,
        version: input.version,
        publisher: input.publisher ?? 'prodivix',
        installationId: input.installationId,
        trustLevel: input.trustLevel ?? 'core',
        publisherVerified: input.publisherVerified ?? true,
        contributions: [
          {
            id: input.contributionId,
            point: 'paletteContribution',
            contractVersion: '1.0',
            descriptor: validation.descriptor as unknown as Readonly<
              Record<string, JsonValue>
            >,
            metadata: { order: input.order ?? 0 },
            paletteProjection: { groups: input.groups },
          },
        ],
      },
      signal
    );
  };

  const cleanupEntries = new Set<Readonly<{ run(): Promise<void> }>>();
  const registerCleanup = (cleanup: () => void | Promise<void>) => {
    let disposed = false;
    let runPromise: Promise<void> | undefined;
    const entry = Object.freeze({
      run: () => {
        runPromise ??= Promise.resolve().then(cleanup);
        return runPromise;
      },
    });
    cleanupEntries.add(entry);
    return Object.freeze({
      run: entry.run,
      dispose: () => {
        if (disposed) return;
        disposed = true;
        cleanupEntries.delete(entry);
      },
    });
  };

  let shutdownPromise: Promise<PluginHostResult<void>> | undefined;
  const shutdown = () => {
    if (shutdownPromise) return shutdownPromise;
    shutdownPromise = (async () => {
      const diagnostics: PluginDiagnostic[] = [];
      for (const entry of [...cleanupEntries]) {
        try {
          await entry.run();
        } catch {
          diagnostics.push(
            createPluginDiagnostic(
              PLUGIN_DIAGNOSTIC_CODES.OWNER_CLEANUP_FAILED,
              'Workspace plugin cleanup task failed.',
              { workspaceId }
            )
          );
        }
      }
      cleanupEntries.clear();
      const hostShutdown = await host.shutdown();
      diagnostics.push(...hostShutdown.diagnostics);
      try {
        await options.onShutdown?.();
      } catch {
        diagnostics.push(
          createPluginDiagnostic(
            PLUGIN_DIAGNOSTIC_CODES.OWNER_CLEANUP_FAILED,
            'Web Plugin Platform dependency cleanup failed.',
            { workspaceId }
          )
        );
      }
      const errors = diagnostics.filter(
        (diagnostic) =>
          diagnostic.severity === 'error' || diagnostic.severity === 'fatal'
      );
      return errors.length > 0
        ? pluginHostFailure(asNonEmptyDiagnostics(diagnostics) ?? [errors[0]!])
        : pluginHostSuccess(undefined, diagnostics);
    })();
    return shutdownPromise;
  };

  const packages = Object.freeze({
    install,
    discover: host.discover,
    disable,
    getSnapshot: host.getSnapshot,
    listSnapshots: host.listSnapshots,
    subscribe: host.subscribe,
    contributions: host.contributions,
  });
  const paletteContributions = Object.freeze({
    workspaceId,
    install: installPalette,
    disable,
  });

  return pluginHostSuccess(
    Object.freeze({
      workspaceId,
      queries: Object.freeze({ workspaceId, palette: paletteQuery }),
      runtime: Object.freeze({
        workspaceId,
        packages,
        paletteContributions,
        registerCleanup,
      }),
      getAuditEvents: auditJournal.list,
      shutdown,
    })
  );
};
