import type {
  ContributionDeclaration,
  ContributionPoint,
} from '@prodivix/plugin-contracts';
import type { CapabilityIdentity } from '#host/capability/capabilityIdentity';
import type { PluginOwnerRef, ContributionIdentity } from '#host/identity';

export type HostContributionPointMap = Partial<
  Record<ContributionPoint, unknown>
>;

export type HostContributionPoint<TMap extends HostContributionPointMap> =
  keyof TMap & ContributionPoint;

export type ContributionLifetime = 'installation' | 'activation';

export type PreparedContribution<T> = Readonly<{
  value: T;
  lifetime: ContributionLifetime;
  dependsOnCapabilities: readonly CapabilityIdentity[];
  order?: number;
  dispose?: () => void | Promise<void>;
}>;

export type ContributionRecord<T> = Readonly<{
  identity: ContributionIdentity;
  owner: PluginOwnerRef;
  point: ContributionPoint;
  contractVersion: string;
  lifetime: ContributionLifetime;
  registrationOrdinal: number;
  requiredCapabilities: readonly CapabilityIdentity[];
  value: T;
}>;

export type AnyContributionRecord<TMap extends HostContributionPointMap> = {
  [TPoint in HostContributionPoint<TMap>]: ContributionRecord<TMap[TPoint]>;
}[HostContributionPoint<TMap>];

export type ContributionRegistration<
  TMap extends HostContributionPointMap,
  TPoint extends HostContributionPoint<TMap>,
> = Readonly<{
  identity: ContributionIdentity;
  owner: PluginOwnerRef;
  point: TPoint;
  contractVersion: string;
  lifetime: ContributionLifetime;
  registrationOrdinal: number;
  order?: number;
  requiredCapabilities: readonly CapabilityIdentity[];
  value: TMap[TPoint];
  dispose?: () => void | Promise<void>;
}>;

export type PreparedContributionEntry<TMap extends HostContributionPointMap> =
  Readonly<{
    declaration: ContributionDeclaration;
    declarationIndex: number;
    prepared: PreparedContribution<TMap[HostContributionPoint<TMap>]>;
  }>;

export type ContributionRegistryEvent<TMap extends HostContributionPointMap> =
  Readonly<{
    revision: number;
    operationId: string;
    added: readonly AnyContributionRecord<TMap>[];
    removed: readonly AnyContributionRecord<TMap>[];
  }>;

export type ContributionRegistryListener<
  TMap extends HostContributionPointMap,
> = (event: ContributionRegistryEvent<TMap>) => void;
