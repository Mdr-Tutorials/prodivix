import {
  createPluginDiagnostic,
  PLUGIN_DIAGNOSTIC_CODES,
  type PluginDiagnostic,
} from '@prodivix/plugin-contracts';
import type {
  CapabilityIdentity,
  HostContributionPointMap,
  PluginRuntimeActivationInput,
} from '@prodivix/plugin-host';
import {
  normalizeGatewayAuditRecord,
  type GatewayAuditOutcome,
  type GatewayAuditPhase,
  type GatewayAuditRecord,
  type GatewayAuditStore,
} from '#browser/gateway/audit/gatewayAudit';
import type {
  GatewayAuditMetadata,
  GatewayContract,
} from '#browser/gateway/gatewayContract';
import { gatewayDiagnosticMeta } from '#browser/gateway/gatewaySessionGuards';

export type GatewaySessionAuditAppendInput = Readonly<{
  contract: GatewayContract;
  phase: GatewayAuditPhase;
  outcome: GatewayAuditOutcome;
  permissionRevision: number;
  requestBytes: number;
  capability?: CapabilityIdentity;
  metadata: GatewayAuditMetadata;
  diagnostics?: readonly PluginDiagnostic[];
  responseBytes?: number;
  durationMs?: number;
  signal?: AbortSignal;
}>;

export type GatewaySessionAuditWriter = Readonly<{
  append(
    input: GatewaySessionAuditAppendInput
  ): Promise<PluginDiagnostic | undefined>;
}>;

const waitForAuditAppend = (
  append: Promise<void>,
  signal: AbortSignal | undefined,
  timeoutMs: number
): Promise<void> =>
  new Promise((resolve, reject) => {
    let settled = false;
    const finish = (callback: () => void) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      signal?.removeEventListener('abort', onAbort);
      callback();
    };
    const onAbort = () =>
      finish(() => reject(new Error('Gateway audit append was canceled.')));
    const timeout = setTimeout(
      () => finish(() => reject(new Error('Gateway audit append timed out.'))),
      timeoutMs
    );
    signal?.addEventListener('abort', onAbort, { once: true });
    if (signal?.aborted) onAbort();
    append.then(
      () => finish(resolve),
      (error: unknown) =>
        finish(() =>
          reject(
            error instanceof Error
              ? error
              : new Error('Gateway audit append failed.')
          )
        )
    );
  });

export const createGatewaySessionAuditWriter = <
  TMap extends HostContributionPointMap,
>(options: {
  activation: PluginRuntimeActivationInput<TMap>;
  store?: GatewayAuditStore;
  wallClock: () => number;
  createEventId: () => string;
  writeTimeoutMs?: number;
  onDiagnostic?: (diagnostic: PluginDiagnostic) => void;
}): GatewaySessionAuditWriter => {
  const writeTimeoutMs = options.writeTimeoutMs ?? 1_000;
  const report = (diagnostic: PluginDiagnostic): PluginDiagnostic => {
    try {
      options.onDiagnostic?.(diagnostic);
    } catch {
      // Diagnostic reporting cannot change the already-decided Gateway result.
    }
    return diagnostic;
  };
  return Object.freeze({
    append: async (input) => {
      if (!options.store) {
        return input.phase === 'preflight' &&
          input.contract.auditMode === 'required-before-effect'
          ? report(
              createPluginDiagnostic(
                PLUGIN_DIAGNOSTIC_CODES.GATEWAY_AUDIT_UNAVAILABLE,
                'Durable Gateway audit storage is unavailable before a sensitive operation.',
                gatewayDiagnosticMeta(
                  options.activation,
                  input.contract.method,
                  input.contract.contractVersion,
                  input.capability
                )
              )
            )
          : undefined;
      }
      const record: GatewayAuditRecord = normalizeGatewayAuditRecord({
        eventId: options.createEventId(),
        occurredAt: options.wallClock(),
        owner: options.activation.owner,
        pluginVersion: options.activation.manifest.version,
        operationId: options.activation.operationId,
        method: input.contract.method,
        contractVersion: input.contract.contractVersion,
        permissionRevision: input.permissionRevision,
        ...(input.capability ? { capability: input.capability } : {}),
        phase: input.phase,
        outcome: input.outcome,
        requestBytes: input.requestBytes,
        ...(input.responseBytes === undefined
          ? {}
          : { responseBytes: input.responseBytes }),
        ...(input.durationMs === undefined
          ? {}
          : { durationMs: input.durationMs }),
        ...(input.diagnostics?.length
          ? {
              diagnosticCodes: input.diagnostics.map(({ code }) => code),
            }
          : {}),
        metadata: input.metadata,
      });
      try {
        await waitForAuditAppend(
          options.store.append(record),
          input.signal,
          writeTimeoutMs
        );
        return undefined;
      } catch {
        return report(
          createPluginDiagnostic(
            input.phase === 'preflight' &&
              input.contract.auditMode === 'required-before-effect'
              ? PLUGIN_DIAGNOSTIC_CODES.GATEWAY_AUDIT_UNAVAILABLE
              : PLUGIN_DIAGNOSTIC_CODES.GATEWAY_AUDIT_WRITE_FAILED,
            input.phase === 'preflight'
              ? 'Gateway preflight audit could not be committed.'
              : 'Gateway outcome audit could not be committed.',
            gatewayDiagnosticMeta(
              options.activation,
              input.contract.method,
              input.contract.contractVersion,
              input.capability
            )
          )
        );
      }
    },
  });
};
