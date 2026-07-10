import {
  isCapabilityGranted,
  pluginHostFailure,
  pluginHostSuccess,
  type CapabilityIdentity,
  type HostContributionPointMap,
  type PluginHostResult,
  type PluginRuntimeActivationInput,
} from '@prodivix/plugin-host';
import type { GatewayExecutionContext } from '#browser/gateway/gatewayContract';
import {
  createGatewayAbortedDiagnostic,
  gatewaySessionSnapshotIsCurrent,
  type GatewayAbortReason,
} from '#browser/gateway/gatewaySessionGuards';

export type GatewayRequestGuard = Readonly<{
  context: GatewayExecutionContext;
  assertActive(): PluginHostResult<void>;
  dispose(): void;
}>;

/**
 * Binds all cancellation and live-authority signals for one Gateway call.
 * Service ports receive only the resulting immutable execution context.
 */
export const createGatewayRequestGuard = <
  TMap extends HostContributionPointMap,
>(options: {
  activation: PluginRuntimeActivationInput<TMap>;
  capability?: CapabilityIdentity;
  method: string;
  contractVersion: string;
  permissionRevision: number;
  timeoutMs: number;
  callerSignal: AbortSignal;
  sessionSignal: AbortSignal;
}): GatewayRequestGuard => {
  const controller = new AbortController();
  let abortReason: GatewayAbortReason | undefined;
  const abort = (reason: GatewayAbortReason) => {
    if (controller.signal.aborted) return;
    abortReason = reason;
    controller.abort(reason);
  };
  const onCallerAbort = () => abort('caller-aborted');
  const onSessionAbort = () => abort('session-disposed');
  options.callerSignal.addEventListener('abort', onCallerAbort, { once: true });
  options.sessionSignal.addEventListener('abort', onSessionAbort, {
    once: true,
  });
  if (options.callerSignal.aborted) onCallerAbort();
  if (options.sessionSignal.aborted) onSessionAbort();
  const timeout = setTimeout(() => abort('timeout'), options.timeoutMs);
  const permissionSubscription = options.activation.permission.subscribe(
    (snapshot) => {
      if (!gatewaySessionSnapshotIsCurrent(options.activation, snapshot)) {
        abort('session-stale');
      } else if (
        options.capability &&
        !isCapabilityGranted(snapshot, options.capability)
      ) {
        abort('permission-revoked');
      }
    }
  );

  const assertActive = (): PluginHostResult<void> => {
    const diagnostic = () =>
      createGatewayAbortedDiagnostic(
        options.activation,
        options.method,
        options.contractVersion,
        abortReason!,
        options.capability
      );
    if (abortReason) return pluginHostFailure([diagnostic()]);
    const snapshot = options.activation.permission.getSnapshot();
    if (!gatewaySessionSnapshotIsCurrent(options.activation, snapshot)) {
      abort('session-stale');
    } else if (
      options.capability &&
      !isCapabilityGranted(snapshot, options.capability)
    ) {
      abort('permission-revoked');
    }
    return abortReason
      ? pluginHostFailure([diagnostic()])
      : pluginHostSuccess(undefined);
  };

  const context: GatewayExecutionContext = Object.freeze({
    owner: options.activation.owner,
    pluginVersion: options.activation.manifest.version,
    operationId: options.activation.operationId,
    sessionToken: options.activation.sessionToken,
    permissionRevision: options.permissionRevision,
    ...(options.capability ? { capability: options.capability } : {}),
    signal: controller.signal,
    assertActive,
  });

  let disposed = false;
  return Object.freeze({
    context,
    assertActive,
    dispose: () => {
      if (disposed) return;
      disposed = true;
      clearTimeout(timeout);
      permissionSubscription.dispose();
      options.callerSignal.removeEventListener('abort', onCallerAbort);
      options.sessionSignal.removeEventListener('abort', onSessionAbort);
    },
  });
};
