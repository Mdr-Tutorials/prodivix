import type {
  ActivationEvent,
  PluginDiagnostic,
  PluginManifestV1,
} from '@prodivix/plugin-contracts';
import type { PermissionSnapshot } from '#host/capability/permissionSnapshot';
import type {
  PreparedContributionEntry,
  HostContributionPointMap,
} from '#host/contribution/contribution.types';
import type { ValidatedContributionDescriptor } from '#host/contribution/contributionPreparation';
import type { PluginOwnerRef } from '#host/identity';
import type {
  Disposable,
  PluginAvailabilityState,
  PluginHostSnapshot,
  PluginPackageSource,
  PluginRuntimeState,
} from '#host/host.types';
import type { PluginRuntimeSession } from '#host/runtime/pluginRuntimeAdapter';

export type PluginOperationKind =
  | 'discover'
  | 'activate'
  | 'deactivate'
  | 'disable'
  | 'reconcile'
  | 'runtime-termination';

export type PluginOperationLease = {
  operationId: string;
  owner: PluginOwnerRef;
  kind: PluginOperationKind;
  controller: AbortController;
  superseded: boolean;
};

export type ManagedPluginRuntimeSession = {
  token: string;
  session: PluginRuntimeSession;
  terminationSubscription: Disposable;
};

export type PluginHostRecord<TMap extends HostContributionPointMap> = {
  source: PluginPackageSource;
  owner: PluginOwnerRef;
  manifest: PluginManifestV1;
  permission?: PermissionSnapshot;
  descriptors: readonly ValidatedContributionDescriptor<TMap>[];
  pendingActivation: readonly PreparedContributionEntry<TMap>[];
  activationContributionIds: ReadonlySet<string>;
  runtimeSession?: ManagedPluginRuntimeSession;
  lastActivationEvent?: ActivationEvent;
  snapshot: PluginHostSnapshot;
};

export const createPluginHostRecord = <
  TMap extends HostContributionPointMap,
>(input: {
  source: PluginPackageSource;
  owner: PluginOwnerRef;
  manifest: PluginManifestV1;
}): PluginHostRecord<TMap> => ({
  source: input.source,
  owner: input.owner,
  manifest: input.manifest,
  descriptors: Object.freeze([]),
  pendingActivation: Object.freeze([]),
  activationContributionIds: new Set(),
  snapshot: Object.freeze({
    pluginId: input.owner.pluginId,
    pluginVersion: input.manifest.version,
    installationId: input.owner.installationId,
    generation: input.owner.generation,
    revision: 0,
    availability: 'discovered',
    runtime: input.manifest.entrypoints?.runtime
      ? 'inactive'
      : 'not-applicable',
    permissionRevision: 0,
    diagnostics: Object.freeze([]),
  }),
});

export const updatePluginHostSnapshot = <TMap extends HostContributionPointMap>(
  record: PluginHostRecord<TMap>,
  update: Readonly<{
    availability?: PluginAvailabilityState;
    runtime?: PluginRuntimeState;
    diagnostics?: readonly PluginDiagnostic[];
  }>
): PluginHostSnapshot => {
  const snapshot = Object.freeze({
    ...record.snapshot,
    revision: record.snapshot.revision + 1,
    availability: update.availability ?? record.snapshot.availability,
    runtime: update.runtime ?? record.snapshot.runtime,
    permissionRevision:
      record.permission?.permissionRevision ??
      record.snapshot.permissionRevision,
    diagnostics: Object.freeze([...(update.diagnostics ?? [])]),
  });
  record.snapshot = snapshot;
  return snapshot;
};
