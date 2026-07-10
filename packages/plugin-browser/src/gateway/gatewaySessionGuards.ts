import {
  createPluginDiagnostic,
  PLUGIN_DIAGNOSTIC_CODES,
  type PluginDiagnostic,
} from '@prodivix/plugin-contracts';
import {
  capabilityIdentityFromRequest,
  isSameCapabilityIdentity,
  isSamePluginOwner,
  pluginHostFailure,
  type CapabilityIdentity,
  type HostContributionPointMap,
  type PermissionSnapshot,
  type PluginHostResult,
  type PluginRuntimeActivationInput,
} from '@prodivix/plugin-host';

export type GatewayAbortReason =
  | 'caller-aborted'
  | 'permission-revoked'
  | 'session-disposed'
  | 'session-stale'
  | 'timeout';

export const gatewayDiagnosticMeta = <TMap extends HostContributionPointMap>(
  activation: PluginRuntimeActivationInput<TMap>,
  method: string,
  contractVersion: string,
  capability?: CapabilityIdentity
) => ({
  pluginId: activation.owner.pluginId,
  pluginVersion: activation.manifest.version,
  installationId: activation.owner.installationId,
  generation: activation.owner.generation,
  operationId: activation.operationId,
  protocolMethod: method,
  contractVersion,
  ...(capability
    ? {
        capabilityId: capability.id,
        ...(capability.scope ? { capabilityScope: capability.scope } : {}),
      }
    : {}),
});

export const gatewaySessionSnapshotIsCurrent = <
  TMap extends HostContributionPointMap,
>(
  activation: PluginRuntimeActivationInput<TMap>,
  snapshot: PermissionSnapshot | undefined
): snapshot is PermissionSnapshot =>
  Boolean(
    snapshot &&
    isSamePluginOwner(snapshot.owner, activation.owner) &&
    snapshot.pluginVersion === activation.manifest.version
  );

export const manifestRequestsGatewayCapability = <
  TMap extends HostContributionPointMap,
>(
  activation: PluginRuntimeActivationInput<TMap>,
  capability: CapabilityIdentity
): boolean =>
  activation.manifest.capabilities.some((request) =>
    isSameCapabilityIdentity(capabilityIdentityFromRequest(request), capability)
  );

export const createGatewayAbortedDiagnostic = <
  TMap extends HostContributionPointMap,
>(
  activation: PluginRuntimeActivationInput<TMap>,
  method: string,
  contractVersion: string,
  reason: GatewayAbortReason,
  capability?: CapabilityIdentity
): PluginDiagnostic => {
  const meta = gatewayDiagnosticMeta(
    activation,
    method,
    contractVersion,
    capability
  );
  if (reason === 'permission-revoked') {
    return createPluginDiagnostic(
      PLUGIN_DIAGNOSTIC_CODES.GATEWAY_CAPABILITY_DENIED,
      'Gateway capability was revoked while the request was in flight.',
      meta
    );
  }
  if (reason === 'session-stale' || reason === 'session-disposed') {
    return createPluginDiagnostic(
      PLUGIN_DIAGNOSTIC_CODES.GATEWAY_SESSION_STALE,
      'Gateway request belongs to a stale or disposed plugin session.',
      { ...meta, reasonCode: reason }
    );
  }
  if (reason === 'timeout') {
    return createPluginDiagnostic(
      PLUGIN_DIAGNOSTIC_CODES.GATEWAY_REQUEST_TIMEOUT,
      'Gateway request exceeded its Host deadline.',
      meta
    );
  }
  return createPluginDiagnostic(
    PLUGIN_DIAGNOSTIC_CODES.GATEWAY_REQUEST_ABORTED,
    'Gateway request was canceled before completion.',
    { ...meta, reasonCode: reason }
  );
};

export const gatewayFailure = <T>(
  diagnostics: readonly PluginDiagnostic[]
): PluginHostResult<T> =>
  pluginHostFailure(
    diagnostics as readonly [PluginDiagnostic, ...PluginDiagnostic[]]
  );
