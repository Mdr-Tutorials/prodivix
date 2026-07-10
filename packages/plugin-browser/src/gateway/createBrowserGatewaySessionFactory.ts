import {
  createPluginDiagnostic,
  PLUGIN_DIAGNOSTIC_CODES,
  type JsonValue,
  type PluginDiagnostic,
} from '@prodivix/plugin-contracts';
import {
  isCapabilityGranted,
  pluginHostFailure,
  pluginHostSuccess,
  type CapabilityIdentity,
  type HostContributionPointMap,
  type PluginHostResult,
} from '@prodivix/plugin-host';
import type {
  BrowserGatewaySession,
  BrowserGatewaySessionFactory,
} from '#browser/gateway/gatewaySession';
import type { GatewayAuditStore } from '#browser/gateway/audit/gatewayAudit';
import { createGatewaySessionAuditWriter } from '#browser/gateway/audit/gatewaySessionAuditWriter';
import type {
  GatewayAuditMetadata,
  GatewayContract,
} from '#browser/gateway/gatewayContract';
import type { GatewayContractRegistry } from '#browser/gateway/gatewayContractRegistry';
import {
  normalizeBrowserGatewayQuotaPolicy,
  type BrowserGatewayQuotaPolicy,
} from '#browser/gateway/gatewayQuotaPolicy';
import { measureGatewayJsonValue } from '#browser/gateway/gatewaySchemaValidation';
import { createGatewayRequestGuard } from '#browser/gateway/gatewayRequestGuard';
import {
  createGatewayAbortedDiagnostic,
  gatewayDiagnosticMeta,
  gatewayFailure,
  gatewaySessionSnapshotIsCurrent,
  manifestRequestsGatewayCapability,
} from '#browser/gateway/gatewaySessionGuards';
import { createTokenBucket, type TokenBucket } from '#browser/quotas';

export type CreateBrowserGatewaySessionFactoryOptions = Readonly<{
  contracts: GatewayContractRegistry;
  auditStore?: GatewayAuditStore;
  quotaPolicy?: Partial<BrowserGatewayQuotaPolicy>;
  now?: () => number;
  wallClock?: () => number;
  createEventId?: () => string;
  onDiagnostic?: (diagnostic: PluginDiagnostic) => void;
}>;

type MethodQuotaState = {
  active: number;
  bucket: TokenBucket;
};

/**
 * Creates one capability-bound Gateway session per isolated runtime. The
 * dispatcher owns policy order and cancellation; injected services only see
 * immutable Host identity plus an AbortSignal and cannot access the transport.
 */
export const createBrowserGatewaySessionFactory = <
  TMap extends HostContributionPointMap,
>(
  options: CreateBrowserGatewaySessionFactoryOptions
): BrowserGatewaySessionFactory<TMap> => {
  const quota = normalizeBrowserGatewayQuotaPolicy(options.quotaPolicy);
  const now = options.now ?? (() => performance.now());
  const wallClock = options.wallClock ?? Date.now;
  let fallbackEventId = 0;
  const createEventId =
    options.createEventId ??
    (() => {
      fallbackEventId += 1;
      return `gateway-audit-${wallClock()}-${fallbackEventId}`;
    });

  return Object.freeze({
    create: async (activation) => {
      const initialSnapshot = activation.permission.getSnapshot();
      if (!gatewaySessionSnapshotIsCurrent(activation, initialSnapshot)) {
        return pluginHostFailure([
          createPluginDiagnostic(
            PLUGIN_DIAGNOSTIC_CODES.GATEWAY_SESSION_STALE,
            'Gateway session cannot bind without the current Host permission snapshot.',
            gatewayDiagnosticMeta(activation, 'gateway/session', '1.0')
          ),
        ]);
      }

      const sessionController = new AbortController();
      const sessionBucket = createTokenBucket(
        quota.requestsPerSecond,
        quota.requestBurst,
        now
      );
      const methodStates = new Map<string, MethodQuotaState>();
      let activeRequests = 0;
      let disposed = false;
      const auditWriter = createGatewaySessionAuditWriter({
        activation,
        store: options.auditStore,
        wallClock,
        createEventId,
        onDiagnostic: options.onDiagnostic,
      });

      const methodState = (contract: GatewayContract): MethodQuotaState => {
        const key = `${contract.method}@${contract.contractVersion}`;
        const existing = methodStates.get(key);
        if (existing) return existing;
        const created = {
          active: 0,
          bucket: createTokenBucket(
            contract.limits.requestsPerSecond,
            contract.limits.requestBurst,
            now
          ),
        };
        methodStates.set(key, created);
        return created;
      };

      const appendAudit = async (
        contract: GatewayContract,
        phase: 'preflight' | 'outcome',
        outcome: 'attempted' | 'success' | 'denied' | 'failed' | 'canceled',
        permissionRevision: number,
        requestBytes: number,
        capability: CapabilityIdentity | undefined,
        metadata: GatewayAuditMetadata,
        diagnostics: readonly PluginDiagnostic[] = [],
        responseBytes?: number,
        durationMs?: number,
        signal?: AbortSignal
      ): Promise<PluginDiagnostic | undefined> =>
        auditWriter.append({
          contract,
          phase,
          outcome,
          permissionRevision,
          requestBytes,
          ...(capability ? { capability } : {}),
          metadata,
          ...(diagnostics.length === 0 ? {} : { diagnostics }),
          ...(responseBytes === undefined ? {} : { responseBytes }),
          ...(durationMs === undefined ? {} : { durationMs }),
          ...(signal ? { signal } : {}),
        });

      const dispatch: BrowserGatewaySession['dispatch'] = async (
        request,
        callerSignal
      ) => {
        const contractResult = options.contracts.require(request);
        if (!contractResult.ok) return contractResult;
        const contract = contractResult.value;
        const validatedRequest = contract.validateRequest(request.payload);
        if (!validatedRequest.ok) return validatedRequest;
        const maxRequestBytes = Math.min(
          quota.maxRequestBytes,
          contract.limits.maxRequestBytes
        );
        const measuredRequest = measureGatewayJsonValue(
          validatedRequest.value,
          maxRequestBytes,
          PLUGIN_DIAGNOSTIC_CODES.GATEWAY_REQUEST_INVALID,
          contract.method,
          contract.contractVersion
        );
        if (!measuredRequest.ok) return measuredRequest;

        const capability = contract.requiredCapability(validatedRequest.value);
        if (
          capability &&
          !manifestRequestsGatewayCapability(activation, capability)
        ) {
          return pluginHostFailure([
            createPluginDiagnostic(
              PLUGIN_DIAGNOSTIC_CODES.GATEWAY_CAPABILITY_NOT_REQUESTED,
              'Plugin Manifest did not request the exact Gateway capability.',
              gatewayDiagnosticMeta(
                activation,
                contract.method,
                contract.contractVersion,
                capability
              )
            ),
          ]);
        }
        const permission = activation.permission.getSnapshot();
        if (!gatewaySessionSnapshotIsCurrent(activation, permission)) {
          return pluginHostFailure([
            createGatewayAbortedDiagnostic(
              activation,
              contract.method,
              contract.contractVersion,
              'session-stale',
              capability
            ),
          ]);
        }
        if (capability && !isCapabilityGranted(permission, capability)) {
          return pluginHostFailure([
            createPluginDiagnostic(
              PLUGIN_DIAGNOSTIC_CODES.GATEWAY_CAPABILITY_DENIED,
              'Current Host permission snapshot denies the Gateway capability.',
              {
                ...gatewayDiagnosticMeta(
                  activation,
                  contract.method,
                  contract.contractVersion,
                  capability
                ),
                permissionRevision: permission.permissionRevision,
              }
            ),
          ]);
        }

        const state = methodState(contract);
        if (
          !sessionBucket.consume() ||
          !state.bucket.consume() ||
          activeRequests >= quota.maxConcurrentRequests ||
          state.active >= contract.limits.maxConcurrency
        ) {
          return pluginHostFailure([
            createPluginDiagnostic(
              PLUGIN_DIAGNOSTIC_CODES.GATEWAY_QUOTA_EXCEEDED,
              'Gateway request exceeded its session or method quota.',
              {
                ...gatewayDiagnosticMeta(
                  activation,
                  contract.method,
                  contract.contractVersion,
                  capability
                ),
                actual: Math.max(activeRequests + 1, state.active + 1),
                limit: Math.min(
                  quota.maxConcurrentRequests,
                  contract.limits.maxConcurrency
                ),
              }
            ),
          ]);
        }

        activeRequests += 1;
        state.active += 1;
        const startedAt = now();
        const requestGuard = createGatewayRequestGuard({
          activation,
          ...(capability ? { capability } : {}),
          method: contract.method,
          contractVersion: contract.contractVersion,
          permissionRevision: permission.permissionRevision,
          timeoutMs: Math.min(quota.maxTimeoutMs, contract.limits.timeoutMs),
          callerSignal,
          sessionSignal: sessionController.signal,
        });
        const { assertActive, context } = requestGuard;

        try {
          const initialActive = assertActive();
          if (!initialActive.ok) return initialActive;
          const resolveAuditMetadata = (
            response?: JsonValue
          ): GatewayAuditMetadata => {
            try {
              return (
                contract.auditMetadata?.(validatedRequest.value, response) ?? {
                  gatewayMethod: contract.method,
                }
              );
            } catch {
              return { gatewayMethod: contract.method };
            }
          };
          const requestMetadata = resolveAuditMetadata();
          const preflightDiagnostic = await appendAudit(
            contract,
            'preflight',
            'attempted',
            permission.permissionRevision,
            measuredRequest.value,
            capability,
            requestMetadata,
            [],
            undefined,
            undefined,
            context.signal
          );
          const afterPreflightAudit = assertActive();
          if (!afterPreflightAudit.ok) return afterPreflightAudit;
          if (
            preflightDiagnostic &&
            contract.auditMode === 'required-before-effect'
          ) {
            return pluginHostFailure([preflightDiagnostic]);
          }
          const beforeExecute = assertActive();
          if (!beforeExecute.ok) return beforeExecute;

          let executed: PluginHostResult<JsonValue>;
          try {
            executed = await contract.execute(context, validatedRequest.value);
          } catch {
            executed = pluginHostFailure([
              createPluginDiagnostic(
                PLUGIN_DIAGNOSTIC_CODES.GATEWAY_HANDLER_FAILED,
                'Gateway service threw before returning a bounded result.',
                gatewayDiagnosticMeta(
                  activation,
                  contract.method,
                  contract.contractVersion,
                  capability
                )
              ),
            ]);
          }

          const afterExecute = assertActive();
          if (!afterExecute.ok) {
            const diagnostic = afterExecute.diagnostics[0]!;
            await appendAudit(
              contract,
              'outcome',
              'canceled',
              permission.permissionRevision,
              measuredRequest.value,
              capability,
              requestMetadata,
              [diagnostic],
              undefined,
              Math.max(0, now() - startedAt)
            );
            return afterExecute;
          }

          if (!executed.ok) {
            const auditDiagnostic = await appendAudit(
              contract,
              'outcome',
              'failed',
              permission.permissionRevision,
              measuredRequest.value,
              capability,
              requestMetadata,
              executed.diagnostics,
              undefined,
              Math.max(0, now() - startedAt)
            );
            return auditDiagnostic
              ? gatewayFailure([...executed.diagnostics, auditDiagnostic])
              : executed;
          }

          const validatedResponse = contract.validateResponse(executed.value);
          if (!validatedResponse.ok) {
            const auditDiagnostic = await appendAudit(
              contract,
              'outcome',
              'failed',
              permission.permissionRevision,
              measuredRequest.value,
              capability,
              requestMetadata,
              validatedResponse.diagnostics,
              undefined,
              Math.max(0, now() - startedAt)
            );
            return auditDiagnostic
              ? gatewayFailure([
                  ...validatedResponse.diagnostics,
                  auditDiagnostic,
                ])
              : validatedResponse;
          }
          const measuredResponse = measureGatewayJsonValue(
            validatedResponse.value,
            Math.min(quota.maxResponseBytes, contract.limits.maxResponseBytes),
            PLUGIN_DIAGNOSTIC_CODES.GATEWAY_RESPONSE_INVALID,
            contract.method,
            contract.contractVersion
          );
          if (!measuredResponse.ok) {
            const auditDiagnostic = await appendAudit(
              contract,
              'outcome',
              'failed',
              permission.permissionRevision,
              measuredRequest.value,
              capability,
              requestMetadata,
              measuredResponse.diagnostics,
              undefined,
              Math.max(0, now() - startedAt)
            );
            return auditDiagnostic
              ? gatewayFailure([
                  ...measuredResponse.diagnostics,
                  auditDiagnostic,
                ])
              : measuredResponse;
          }
          const finalActive = assertActive();
          if (!finalActive.ok) {
            const diagnostic = finalActive.diagnostics[0]!;
            await appendAudit(
              contract,
              'outcome',
              'canceled',
              permission.permissionRevision,
              measuredRequest.value,
              capability,
              requestMetadata,
              [diagnostic],
              measuredResponse.value,
              Math.max(0, now() - startedAt)
            );
            return finalActive;
          }

          const outcomeMetadata = resolveAuditMetadata(validatedResponse.value);
          const auditDiagnostic = await appendAudit(
            contract,
            'outcome',
            'success',
            permission.permissionRevision,
            measuredRequest.value,
            capability,
            outcomeMetadata,
            [],
            measuredResponse.value,
            Math.max(0, now() - startedAt)
          );
          return pluginHostSuccess(
            validatedResponse.value,
            auditDiagnostic ? [auditDiagnostic] : executed.diagnostics
          );
        } finally {
          requestGuard.dispose();
          activeRequests -= 1;
          state.active -= 1;
        }
      };

      const session: BrowserGatewaySession = Object.freeze({
        dispatch,
        dispose: () => {
          if (disposed) return;
          disposed = true;
          sessionController.abort('session-disposed');
          methodStates.clear();
        },
      });
      return pluginHostSuccess(session);
    },
  });
};
