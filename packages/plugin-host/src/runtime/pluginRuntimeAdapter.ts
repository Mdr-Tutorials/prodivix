import type {
  ActivationEvent,
  PluginManifestV1,
} from '@prodivix/plugin-contracts';
import type { LivePermissionGuard } from '#host/capability/permissionSnapshot';
import type { ScopedContributionTransaction } from '#host/contribution/contributionTransaction';
import type { HostContributionPointMap } from '#host/contribution/contribution.types';
import type { PluginOwnerRef } from '#host/identity';
import type { Disposable } from '#host/host.types';
import type { PluginHostResult } from '#host/result';
import type { VerifiedPluginRuntimeArtifact } from '#host/runtime/runtimeArtifact';

export type RuntimeDeactivationReason =
  | 'manual'
  | 'disable'
  | 'permission-revoked'
  | 'generation-replaced'
  | 'activation-rollback'
  | 'host-shutdown';

export type RuntimeTerminationEvent = Readonly<{
  sessionToken: string;
  reasonCode: string;
}>;

export type PluginRuntimeSession = {
  deactivate(
    reason: RuntimeDeactivationReason,
    signal: AbortSignal
  ): Promise<PluginHostResult<void>>;
  onDidTerminate(
    listener: (event: RuntimeTerminationEvent) => void
  ): Disposable;
};

export type PluginRuntimeActivationInput<
  TMap extends HostContributionPointMap,
> = Readonly<{
  owner: PluginOwnerRef;
  manifest: PluginManifestV1;
  runtimeArtifact: VerifiedPluginRuntimeArtifact;
  event: ActivationEvent;
  operationId: string;
  sessionToken: string;
  permission: LivePermissionGuard;
  contributions: ScopedContributionTransaction<TMap>;
}>;

export type PluginRuntimeAdapter<TMap extends HostContributionPointMap> = {
  activate(
    input: PluginRuntimeActivationInput<TMap>,
    signal: AbortSignal
  ): Promise<PluginHostResult<PluginRuntimeSession>>;
};
