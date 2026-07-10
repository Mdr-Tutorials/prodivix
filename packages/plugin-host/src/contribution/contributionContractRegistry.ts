import {
  createPluginDiagnostic,
  PLUGIN_DIAGNOSTIC_CODES,
  type ContributionPoint,
} from '@prodivix/plugin-contracts';
import type { HostContributionPointMap } from '#host/contribution/contribution.types';
import type { RegisteredContributionContract } from '#host/contribution/contributionContract';
import {
  pluginHostFailure,
  pluginHostSuccess,
  type PluginHostResult,
} from '#host/result';

export type ContributionContractIdentity = Readonly<{
  point: ContributionPoint;
  contractVersion: string;
}>;

export type ContributionContractRegistry<
  TMap extends HostContributionPointMap,
> = Readonly<{
  get(
    identity: ContributionContractIdentity
  ): RegisteredContributionContract<TMap> | undefined;
  list(): readonly RegisteredContributionContract<TMap>[];
}>;

const contractKey = (identity: ContributionContractIdentity): string =>
  JSON.stringify([identity.point, identity.contractVersion]);

export const createContributionContractRegistry = <
  TMap extends HostContributionPointMap,
>(
  contracts: readonly RegisteredContributionContract<TMap>[]
): PluginHostResult<ContributionContractRegistry<TMap>> => {
  const byKey = new Map<string, RegisteredContributionContract<TMap>>();
  for (const contract of contracts) {
    const key = contractKey(contract);
    if (byKey.has(key)) {
      return pluginHostFailure([
        createPluginDiagnostic(
          PLUGIN_DIAGNOSTIC_CODES.CONTRIBUTION_CONTRACT_CONFLICT,
          `Contribution contract ${JSON.stringify(contract.point)} version ${JSON.stringify(contract.contractVersion)} is registered more than once.`,
          {
            contributionPoint: contract.point,
            contractVersion: contract.contractVersion,
          }
        ),
      ]);
    }
    byKey.set(key, contract);
  }

  const ordered = Object.freeze(
    [...byKey.values()].sort(
      (left, right) =>
        left.point.localeCompare(right.point) ||
        left.contractVersion.localeCompare(right.contractVersion)
    )
  );
  return pluginHostSuccess(
    Object.freeze({
      get: (identity) => byKey.get(contractKey(identity)),
      list: () => ordered,
    })
  );
};
