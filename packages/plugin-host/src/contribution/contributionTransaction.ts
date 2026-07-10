import type { CapabilityIdentity } from '#host/capability/capabilityIdentity';
import type {
  ContributionRegistration,
  ContributionRegistryEvent,
  ContributionLifetime,
  HostContributionPoint,
  HostContributionPointMap,
} from '#host/contribution/contribution.types';
import type { PluginOwnerRef } from '#host/identity';
import type { PluginHostResult } from '#host/result';

export type ContributionTransactionContext = Readonly<{
  owner: PluginOwnerRef;
  expectedRegistryRevision: number;
  expectedPermissionRevision: number;
  lifetime: ContributionLifetime;
  operationId: string;
  replaceOwner?: PluginOwnerRef;
}>;

export type ContributionTransactionState = 'open' | 'committed' | 'rolled-back';

export type ContributionTransaction<TMap extends HostContributionPointMap> =
  Readonly<{
    stage<TPoint extends HostContributionPoint<TMap>>(
      registration: ContributionRegistration<TMap, TPoint>
    ): PluginHostResult<void>;
    commit(): Promise<PluginHostResult<ContributionRegistryEvent<TMap>>>;
    rollback(): Promise<PluginHostResult<void>>;
    getState(): ContributionTransactionState;
  }>;

export type ScopedContributionTransaction<
  TMap extends HostContributionPointMap,
> = Readonly<{
  stage<TPoint extends HostContributionPoint<TMap>>(input: {
    contributionId: string;
    point: TPoint;
    contractVersion: string;
    registrationOrdinal: number;
    order?: number;
    requiredCapabilities: readonly CapabilityIdentity[];
    value: TMap[TPoint];
    dispose?: () => void | Promise<void>;
  }): PluginHostResult<void>;
}>;
