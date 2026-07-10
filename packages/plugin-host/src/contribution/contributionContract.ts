import type {
  ContributionDeclaration,
  JsonValue,
} from '@prodivix/plugin-contracts';
import type { PermissionSnapshotReader } from '#host/capability/permissionSnapshot';
import type { PluginOwnerRef } from '#host/identity';
import type { PluginHostResult } from '#host/result';
import type {
  HostContributionPoint,
  HostContributionPointMap,
  PreparedContribution,
} from '#host/contribution/contribution.types';

export type ContributionPrepareContext<TDescriptor> = Readonly<{
  owner: PluginOwnerRef;
  declaration: ContributionDeclaration;
  descriptor: TDescriptor;
  permission: PermissionSnapshotReader;
  operationId: string;
  signal: AbortSignal;
}>;

export type ContributionContractDefinition<
  TMap extends HostContributionPointMap,
  TPoint extends HostContributionPoint<TMap>,
  TDescriptor,
> = Readonly<{
  point: TPoint;
  contractVersion: string;
  validateDescriptor(input: JsonValue): PluginHostResult<TDescriptor>;
  prepare(
    context: ContributionPrepareContext<TDescriptor>
  ): Promise<PluginHostResult<PreparedContribution<TMap[TPoint]>>>;
}>;

export type RegisteredContributionContract<
  TMap extends HostContributionPointMap,
> = Readonly<{
  point: HostContributionPoint<TMap>;
  contractVersion: string;
  validateDescriptor(input: JsonValue): PluginHostResult<JsonValue>;
  prepare(
    context: ContributionPrepareContext<JsonValue>
  ): Promise<
    PluginHostResult<PreparedContribution<TMap[HostContributionPoint<TMap>]>>
  >;
}>;

export const defineContributionContract = <
  TMap extends HostContributionPointMap,
  TPoint extends HostContributionPoint<TMap>,
  TDescriptor,
>(
  definition: ContributionContractDefinition<TMap, TPoint, TDescriptor>
): RegisteredContributionContract<TMap> =>
  Object.freeze({
    point: definition.point,
    contractVersion: definition.contractVersion,
    validateDescriptor: (input) => definition.validateDescriptor(input),
    prepare: async (context) =>
      definition.prepare({
        ...context,
        descriptor: context.descriptor as TDescriptor,
      }),
  }) as RegisteredContributionContract<TMap>;
