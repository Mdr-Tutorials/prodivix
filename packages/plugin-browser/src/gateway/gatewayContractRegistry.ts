import {
  createPluginDiagnostic,
  PLUGIN_DIAGNOSTIC_CODES,
} from '@prodivix/plugin-contracts';
import {
  pluginHostFailure,
  pluginHostSuccess,
  type PluginHostResult,
} from '@prodivix/plugin-host';
import {
  gatewayContractKey,
  type GatewayContract,
  type GatewayContractIdentity,
} from '#browser/gateway/gatewayContract';

export type GatewayContractRegistry = Readonly<{
  require(identity: GatewayContractIdentity): PluginHostResult<GatewayContract>;
  list(): readonly GatewayContract[];
}>;

const isPositiveInteger = (value: number): boolean =>
  Number.isSafeInteger(value) && value > 0;

const isValidContract = (contract: GatewayContract): boolean =>
  /^[a-z][a-z0-9-]*(?:\.[a-z][a-z0-9-]*)*(?:\/[a-z][a-z0-9-]*)+$/.test(
    contract.method
  ) &&
  /^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$/.test(contract.contractVersion) &&
  Object.values(contract.limits).every(isPositiveInteger);

export const createGatewayContractRegistry = (
  contracts: readonly GatewayContract[]
): PluginHostResult<GatewayContractRegistry> => {
  const byKey = new Map<string, GatewayContract>();
  for (const contract of contracts) {
    if (!isValidContract(contract)) {
      return pluginHostFailure([
        createPluginDiagnostic(
          PLUGIN_DIAGNOSTIC_CODES.GATEWAY_HANDLER_UNAVAILABLE,
          'Gateway registry received an invalid contract definition.',
          {
            contractVersion: contract.contractVersion,
            protocolMethod: contract.method,
          }
        ),
      ]);
    }
    const key = gatewayContractKey(contract);
    if (byKey.has(key)) {
      return pluginHostFailure([
        createPluginDiagnostic(
          PLUGIN_DIAGNOSTIC_CODES.GATEWAY_HANDLER_UNAVAILABLE,
          'Gateway registry received a duplicate exact method contract.',
          {
            contractVersion: contract.contractVersion,
            protocolMethod: contract.method,
          }
        ),
      ]);
    }
    byKey.set(
      key,
      Object.freeze({
        ...contract,
        limits: Object.freeze({ ...contract.limits }),
      })
    );
  }
  const frozen = Object.freeze([...byKey.values()]);
  return pluginHostSuccess(
    Object.freeze({
      require: (identity: GatewayContractIdentity) => {
        const contract = byKey.get(gatewayContractKey(identity));
        return contract
          ? pluginHostSuccess(contract)
          : pluginHostFailure([
              createPluginDiagnostic(
                PLUGIN_DIAGNOSTIC_CODES.GATEWAY_HANDLER_UNAVAILABLE,
                'Gateway method is not registered at the requested exact version.',
                {
                  contractVersion: identity.contractVersion,
                  protocolMethod: identity.method,
                }
              ),
            ]);
      },
      list: () => frozen,
    })
  );
};
