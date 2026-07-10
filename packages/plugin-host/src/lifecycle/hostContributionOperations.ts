import {
  createPluginDiagnostic,
  PLUGIN_DIAGNOSTIC_CODES,
  type PluginDiagnostic,
} from '@prodivix/plugin-contracts';
import type { CapabilityIdentity } from '#host/capability/capabilityIdentity';
import type { PermissionSnapshot } from '#host/capability/permissionSnapshot';
import type { ContributionContractRegistry } from '#host/contribution/contributionContractRegistry';
import type {
  ContributionLifetime,
  HostContributionPoint,
  HostContributionPointMap,
  PreparedContributionEntry,
} from '#host/contribution/contribution.types';
import type {
  ContributionTransaction,
  ScopedContributionTransaction,
} from '#host/contribution/contributionTransaction';
import {
  createContributionIdentity,
  type PluginOwnerRef,
} from '#host/identity';
import {
  asNonEmptyDiagnostics,
  pluginHostFailure,
  pluginHostSuccess,
  type PluginHostResult,
} from '#host/result';

const entryMeta = <TMap extends HostContributionPointMap>(
  owner: PluginOwnerRef,
  operationId: string,
  entry: PreparedContributionEntry<TMap>
) => ({
  pluginId: owner.pluginId,
  installationId: owner.installationId,
  generation: owner.generation,
  operationId,
  contributionId: entry.declaration.id,
  contributionPoint: entry.declaration.point,
  contractVersion: entry.declaration.contractVersion,
});

export const splitPreparedContributions = <
  TMap extends HostContributionPointMap,
>(
  entries: readonly PreparedContributionEntry<TMap>[]
): Readonly<{
  installation: readonly PreparedContributionEntry<TMap>[];
  activation: readonly PreparedContributionEntry<TMap>[];
}> =>
  Object.freeze({
    installation: Object.freeze(
      entries.filter((entry) => entry.prepared.lifetime === 'installation')
    ),
    activation: Object.freeze(
      entries.filter((entry) => entry.prepared.lifetime === 'activation')
    ),
  });

export const disposePreparedContributions = async <
  TMap extends HostContributionPointMap,
>(
  entries: readonly PreparedContributionEntry<TMap>[],
  owner: PluginOwnerRef,
  operationId: string
): Promise<readonly PluginDiagnostic[]> => {
  const diagnostics: PluginDiagnostic[] = [];
  for (const entry of [...entries].reverse()) {
    try {
      await entry.prepared.dispose?.();
    } catch {
      diagnostics.push(
        createPluginDiagnostic(
          PLUGIN_DIAGNOSTIC_CODES.OWNER_CLEANUP_FAILED,
          `Prepared contribution ${JSON.stringify(entry.declaration.id)} could not be disposed.`,
          entryMeta(owner, operationId, entry)
        )
      );
    }
  }
  return Object.freeze(diagnostics);
};

const stagePreparedEntry = <TMap extends HostContributionPointMap>(
  transaction: ContributionTransaction<TMap>,
  owner: PluginOwnerRef,
  entry: PreparedContributionEntry<TMap>
): PluginHostResult<void> => {
  type TPoint = HostContributionPoint<TMap>;
  return transaction.stage<TPoint>({
    identity: createContributionIdentity(owner.pluginId, entry.declaration.id),
    owner,
    point: entry.declaration.point as TPoint,
    contractVersion: entry.declaration.contractVersion,
    lifetime: entry.prepared.lifetime,
    registrationOrdinal: entry.declarationIndex,
    order: entry.prepared.order,
    requiredCapabilities: entry.prepared.dependsOnCapabilities,
    value: entry.prepared.value,
    dispose: entry.prepared.dispose,
  });
};

export const stagePreparedContributions = async <
  TMap extends HostContributionPointMap,
>(
  transaction: ContributionTransaction<TMap>,
  owner: PluginOwnerRef,
  entries: readonly PreparedContributionEntry<TMap>[],
  operationId: string,
  expectedLifetime: ContributionLifetime
): Promise<PluginHostResult<void>> => {
  for (const [index, entry] of entries.entries()) {
    if (entry.prepared.lifetime !== expectedLifetime) {
      const rollback = await transaction.rollback();
      const cleanup = await disposePreparedContributions(
        entries.slice(index),
        owner,
        operationId
      );
      return pluginHostFailure([
        createPluginDiagnostic(
          PLUGIN_DIAGNOSTIC_CODES.CONTRIBUTION_RESOLVER_FAILED,
          `Contribution ${JSON.stringify(entry.declaration.id)} changed its declared lifetime.`,
          entryMeta(owner, operationId, entry)
        ),
        ...rollback.diagnostics,
        ...cleanup,
      ]);
    }
    const staged = stagePreparedEntry(transaction, owner, entry);
    if (!staged.ok) {
      const rollback = await transaction.rollback();
      const cleanup = await disposePreparedContributions(
        entries.slice(index),
        owner,
        operationId
      );
      const diagnostics = asNonEmptyDiagnostics([
        ...staged.diagnostics,
        ...rollback.diagnostics,
        ...cleanup,
      ]);
      return pluginHostFailure(
        diagnostics ?? [
          createPluginDiagnostic(
            PLUGIN_DIAGNOSTIC_CODES.CONTRIBUTION_RESOLVER_FAILED,
            'Prepared contribution could not be staged.',
            entryMeta(owner, operationId, entry)
          ),
        ]
      );
    }
  }
  return pluginHostSuccess(undefined);
};

export const createScopedContributionTransaction = <
  TMap extends HostContributionPointMap,
>(input: {
  transaction: ContributionTransaction<TMap>;
  owner: PluginOwnerRef;
  permission: PermissionSnapshot;
  contracts: ContributionContractRegistry<TMap>;
  operationId: string;
}): ScopedContributionTransaction<TMap> =>
  Object.freeze({
    stage: <TPoint extends HostContributionPoint<TMap>>(registration: {
      contributionId: string;
      point: TPoint;
      contractVersion: string;
      registrationOrdinal: number;
      order?: number;
      requiredCapabilities: readonly CapabilityIdentity[];
      value: TMap[TPoint];
      dispose?: () => void | Promise<void>;
    }): PluginHostResult<void> => {
      if (
        !input.contracts.get({
          point: registration.point,
          contractVersion: registration.contractVersion,
        })
      ) {
        return pluginHostFailure([
          createPluginDiagnostic(
            PLUGIN_DIAGNOSTIC_CODES.UNSUPPORTED_CONTRIBUTION_CONTRACT,
            `Runtime contribution uses unsupported ${JSON.stringify(registration.point)} contract ${JSON.stringify(registration.contractVersion)}.`,
            {
              pluginId: input.owner.pluginId,
              installationId: input.owner.installationId,
              generation: input.owner.generation,
              operationId: input.operationId,
              contributionId: registration.contributionId,
              contributionPoint: registration.point,
              contractVersion: registration.contractVersion,
              permissionRevision: input.permission.permissionRevision,
            }
          ),
        ]);
      }
      const registerCapability: CapabilityIdentity = {
        id: 'extension.register',
        scope: registration.point,
      };
      return input.transaction.stage({
        identity: createContributionIdentity(
          input.owner.pluginId,
          registration.contributionId
        ),
        owner: input.owner,
        point: registration.point,
        contractVersion: registration.contractVersion,
        lifetime: 'activation',
        registrationOrdinal: registration.registrationOrdinal,
        order: registration.order,
        requiredCapabilities: [
          registerCapability,
          ...registration.requiredCapabilities,
        ],
        value: registration.value,
        dispose: registration.dispose,
      });
    },
  });
