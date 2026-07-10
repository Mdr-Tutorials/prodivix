import {
  createPluginDiagnostic,
  PLUGIN_DIAGNOSTIC_CODES,
  type JsonValue,
  type PluginDiagnostic,
} from '@prodivix/plugin-contracts';
import {
  pluginHostFailure,
  pluginHostSuccess,
  type HostContributionPointMap,
  type PluginHostResult,
  type PluginRuntimeAdapter,
  type PluginRuntimeSession,
  type RuntimeDeactivationReason,
  type RuntimeTerminationEvent,
} from '@prodivix/plugin-host';
import {
  BUILT_IN_PROTOCOL_CONTRACTS,
  createProtocolContractRegistry,
  createProtocolEndpoint,
  protocolFailure,
  protocolSuccess,
  type ProtocolEndpoint,
  type ProtocolEvent,
  type ProtocolRequest,
} from '@prodivix/plugin-protocol';
import type {
  BrowserGatewaySession,
  BrowserGatewaySessionFactory,
} from '#browser/gateway/gatewaySession';
import {
  RUNTIME_WORKER_BOOTSTRAP_DIGEST,
  RUNTIME_WORKER_BOOTSTRAP_SOURCE,
} from '#browser/generated/runtimeWorkerBootstrap.generated';
import {
  createTokenBucket,
  normalizeBrowserPluginQuotaPolicy,
  type BrowserPluginQuotaPolicy,
} from '#browser/quotas';
import type { BrowserRuntimeSandboxFactory } from '#browser/sandbox/sandbox.types';

export type BrowserImplementationEventHandler = (
  event: ProtocolEvent
) => void | Promise<void>;

export type CreateBrowserPluginRuntimeAdapterOptions<
  TMap extends HostContributionPointMap,
> = Readonly<{
  sandboxFactory: BrowserRuntimeSandboxFactory;
  gatewaySessionFactory?: BrowserGatewaySessionFactory<TMap>;
  quotaPolicy?: Partial<BrowserPluginQuotaPolicy>;
  onImplementationEvent?: BrowserImplementationEventHandler;
  now?: () => number;
}>;

type RuntimeReadyPayload = Readonly<{
  selectedProtocolVersion: '1.0';
  runtimeDigest: string;
  runtimeModuleVersion?: string;
}>;

const asRecord = (value: JsonValue): Record<string, JsonValue> | undefined =>
  typeof value === 'object' && value !== null && !Array.isArray(value)
    ? value
    : undefined;

const GATEWAY_DENIAL_CODES = new Set<PluginDiagnostic['code']>([
  PLUGIN_DIAGNOSTIC_CODES.GATEWAY_CAPABILITY_NOT_REQUESTED,
  PLUGIN_DIAGNOSTIC_CODES.GATEWAY_CAPABILITY_DENIED,
  PLUGIN_DIAGNOSTIC_CODES.GATEWAY_NETWORK_POLICY_DENIED,
  PLUGIN_DIAGNOSTIC_CODES.GATEWAY_QUOTA_EXCEEDED,
]);

const wireDiagnostic = (diagnostic: PluginDiagnostic) => ({
  code: diagnostic.code,
  message: GATEWAY_DENIAL_CODES.has(diagnostic.code)
    ? 'Host Gateway request was denied.'
    : diagnostic.code === PLUGIN_DIAGNOSTIC_CODES.GATEWAY_REQUEST_TIMEOUT ||
        diagnostic.code === PLUGIN_DIAGNOSTIC_CODES.GATEWAY_REQUEST_ABORTED
      ? 'Host Gateway request was canceled.'
      : 'Host Gateway request failed.',
});

const runtimeMeta = <TMap extends HostContributionPointMap>(
  input: Parameters<PluginRuntimeAdapter<TMap>['activate']>[0]
) => ({
  pluginId: input.owner.pluginId,
  pluginVersion: input.manifest.version,
  installationId: input.owner.installationId,
  generation: input.owner.generation,
  operationId: input.operationId,
  runtimeArtifactPath: input.runtimeArtifact.path,
  runtimeArtifactDigest: input.runtimeArtifact.digest,
  packageDigest: input.runtimeArtifact.packageDigest,
});

const createUnavailableGatewaySession = (): BrowserGatewaySession =>
  Object.freeze({
    dispatch: async () =>
      pluginHostFailure([
        createPluginDiagnostic(
          PLUGIN_DIAGNOSTIC_CODES.UNKNOWN_PROTOCOL_CONTRACT,
          'No Host Gateway session is bound to this browser runtime.'
        ),
      ]),
    dispose: () => {},
  });

const disposeGateway = async (
  gateway: BrowserGatewaySession | undefined
): Promise<void> => {
  try {
    await gateway?.dispose();
  } catch {
    return;
  }
};

export const createBrowserPluginRuntimeAdapter = <
  TMap extends HostContributionPointMap,
>(
  options: CreateBrowserPluginRuntimeAdapterOptions<TMap>
): PluginHostResult<PluginRuntimeAdapter<TMap>> => {
  const contractsResult = createProtocolContractRegistry(
    BUILT_IN_PROTOCOL_CONTRACTS
  );
  if (!contractsResult.ok) return contractsResult;
  const contracts = contractsResult.value;
  const quota = normalizeBrowserPluginQuotaPolicy(options.quotaPolicy);
  const now = options.now ?? (() => performance.now());

  const activate: PluginRuntimeAdapter<TMap>['activate'] = async (
    input,
    signal
  ) => {
    const meta = runtimeMeta(input);
    const gatewayResult = options.gatewaySessionFactory
      ? await options.gatewaySessionFactory.create(input)
      : pluginHostSuccess(createUnavailableGatewaySession());
    if (!gatewayResult.ok) return gatewayResult;
    const gateway = gatewayResult.value;
    const sandboxResult = await options.sandboxFactory.start(
      {
        activation: input,
        workerBootstrap: {
          source: RUNTIME_WORKER_BOOTSTRAP_SOURCE,
          digest: RUNTIME_WORKER_BOOTSTRAP_DIGEST,
        },
        supportedProtocolVersions: ['1.0'],
        handshakeTimeoutMs: quota.handshakeTimeoutMs,
      },
      signal
    );
    if (!sandboxResult.ok) {
      await disposeGateway(gateway);
      return sandboxResult;
    }
    const sandbox = sandboxResult.value;
    const terminationListeners = new Set<
      (event: RuntimeTerminationEvent) => void
    >();
    const incomingRate = createTokenBucket(
      quota.messagesPerSecond,
      quota.messageBurst,
      now
    );
    let endpoint: ProtocolEndpoint;
    let gatewayPending = 0;
    let heartbeatTimer: ReturnType<typeof setInterval> | undefined;
    let heartbeatPending = false;
    let heartbeatMisses = 0;
    let terminated = false;
    let intentionalDeactivation = false;
    let readySettled = false;
    let resolveReady!: (result: PluginHostResult<RuntimeReadyPayload>) => void;
    const readyPromise = new Promise<PluginHostResult<RuntimeReadyPayload>>(
      (resolve) => {
        resolveReady = resolve;
      }
    );

    const settleReady = (result: PluginHostResult<RuntimeReadyPayload>) => {
      if (readySettled) return;
      readySettled = true;
      resolveReady(result);
    };

    const emitTermination = (reasonCode: string) => {
      if (intentionalDeactivation) return;
      const event = Object.freeze({
        sessionToken: input.sessionToken,
        reasonCode,
      });
      for (const listener of [...terminationListeners]) {
        try {
          listener(event);
        } catch {
          continue;
        }
      }
    };

    const terminate = (reasonCode: string, diagnostic?: PluginDiagnostic) => {
      if (terminated) return;
      terminated = true;
      if (heartbeatTimer !== undefined) clearInterval(heartbeatTimer);
      endpoint?.close(reasonCode);
      sandbox.dispose();
      void disposeGateway(gateway);
      settleReady(
        pluginHostFailure([
          diagnostic ??
            createPluginDiagnostic(
              PLUGIN_DIAGNOSTIC_CODES.SANDBOX_TERMINATED,
              'Browser plugin sandbox terminated before runtime startup completed.',
              { ...meta, reasonCode, transportId: sandbox.transportId }
            ),
        ])
      );
      emitTermination(reasonCode);
    };

    const dispatchGateway = async (
      request: ProtocolRequest,
      requestSignal: AbortSignal
    ) => {
      if (request.channel !== 'gateway') {
        return protocolFailure([
          createPluginDiagnostic(
            PLUGIN_DIAGNOSTIC_CODES.UNKNOWN_PROTOCOL_CONTRACT,
            'Browser Host accepts runtime requests only on the Gateway channel.',
            meta
          ),
        ]);
      }
      if (gatewayPending >= quota.maxPendingRequests) {
        const diagnostic = createPluginDiagnostic(
          PLUGIN_DIAGNOSTIC_CODES.SANDBOX_MESSAGE_QUOTA_EXCEEDED,
          'Browser plugin exceeded its pending Gateway request limit.',
          {
            ...meta,
            limit: quota.maxPendingRequests,
            actual: gatewayPending + 1,
          }
        );
        terminate('pending-request-quota', diagnostic);
        return protocolFailure([diagnostic]);
      }
      gatewayPending += 1;
      try {
        const result = await gateway.dispatch(
          {
            method: request.method,
            contractVersion: request.contractVersion,
            payload: request.payload,
          },
          requestSignal
        );
        return protocolSuccess<JsonValue>(
          result.ok
            ? { ok: true, result: result.value }
            : {
                ok: false,
                diagnostics: result.diagnostics
                  .slice(0, 16)
                  .map(wireDiagnostic),
              }
        );
      } finally {
        gatewayPending -= 1;
      }
    };

    const handleEvent = async (event: ProtocolEvent) => {
      if (event.channel === 'control' && event.method === 'runtime/ready') {
        const payload = asRecord(event.payload);
        if (
          payload?.selectedProtocolVersion !== '1.0' ||
          payload.runtimeDigest !== input.runtimeArtifact.digest
        ) {
          const diagnostic = createPluginDiagnostic(
            PLUGIN_DIAGNOSTIC_CODES.SANDBOX_HANDSHAKE_FAILED,
            'Runtime ready identity does not match the verified Host artifact.',
            meta
          );
          terminate('runtime-ready-mismatch', diagnostic);
          return;
        }
        settleReady(
          pluginHostSuccess({
            selectedProtocolVersion: '1.0',
            runtimeDigest: input.runtimeArtifact.digest,
            ...(typeof payload.runtimeModuleVersion === 'string'
              ? { runtimeModuleVersion: payload.runtimeModuleVersion }
              : {}),
          })
        );
        return;
      }
      if (event.channel === 'control' && event.method === 'runtime/error') {
        const payload = asRecord(event.payload);
        terminate(
          typeof payload?.reasonCode === 'string'
            ? payload.reasonCode
            : 'runtime-error'
        );
        return;
      }
      if (event.channel === 'implementation') {
        await options.onImplementationEvent?.(event);
      }
    };

    endpoint = createProtocolEndpoint({
      contracts,
      messagePrefix: `host-${input.sessionToken}`,
      codecLimits: { maxBytes: quota.maxMessageBytes },
      defaultRequestTimeoutMs: quota.gatewayTimeoutMs,
      sendText: (text) => sandbox.port.postMessage(text),
      onRequest: dispatchGateway,
      onEvent: handleEvent,
      onFatal: (diagnostic) => terminate('protocol-violation', diagnostic),
    });

    const onPortMessage = (event: MessageEvent) => {
      if (!incomingRate.consume()) {
        terminate(
          'message-rate-quota',
          createPluginDiagnostic(
            PLUGIN_DIAGNOSTIC_CODES.SANDBOX_MESSAGE_QUOTA_EXCEEDED,
            'Browser plugin exceeded its inbound message rate.',
            {
              ...meta,
              limit: quota.messagesPerSecond,
              transportId: sandbox.transportId,
            }
          )
        );
        return;
      }
      void endpoint.receive(event.data);
    };
    const onPortMessageError = () => terminate('message-deserialization-error');
    sandbox.port.addEventListener('message', onPortMessage);
    sandbox.port.addEventListener('messageerror', onPortMessageError);
    sandbox.port.start();
    const startupAbort = () => terminate('activation-aborted');
    signal.addEventListener('abort', startupAbort, { once: true });
    const readyTimeout = setTimeout(
      () =>
        terminate(
          'runtime-ready-timeout',
          createPluginDiagnostic(
            PLUGIN_DIAGNOSTIC_CODES.SANDBOX_HANDSHAKE_FAILED,
            `Runtime ready handshake exceeded ${quota.handshakeTimeoutMs} ms.`,
            { ...meta, limit: quota.handshakeTimeoutMs }
          )
        ),
      quota.handshakeTimeoutMs
    );
    const ready = await readyPromise;
    clearTimeout(readyTimeout);
    signal.removeEventListener('abort', startupAbort);
    if (!ready.ok) return ready;
    if (terminated) {
      return pluginHostFailure([
        createPluginDiagnostic(
          PLUGIN_DIAGNOSTIC_CODES.SANDBOX_TERMINATED,
          'Browser plugin sandbox terminated during runtime handshake.',
          { ...meta, reasonCode: 'terminated-during-handshake' }
        ),
      ]);
    }

    const activated = await endpoint.request({
      channel: 'control',
      method: 'runtime/activate',
      contractVersion: '1.0',
      payload: { event: input.event as JsonValue },
      timeoutMs: quota.lifecycleTimeoutMs,
      signal,
    });
    if (!activated.ok) {
      terminate('runtime-activation-failed');
      return activated;
    }
    const activationPayload = asRecord(activated.value);
    if (activationPayload?.ok !== true) {
      const failure = pluginHostFailure([
        createPluginDiagnostic(
          PLUGIN_DIAGNOSTIC_CODES.RUNTIME_ACTIVATION_FAILED,
          'Isolated plugin runtime rejected activation.',
          meta
        ),
      ]);
      terminate('runtime-activation-rejected');
      return failure;
    }

    const heartbeat = async () => {
      if (terminated || heartbeatPending) return;
      heartbeatPending = true;
      const nonce = `${input.sessionToken}:${Date.now()}`;
      const result = await endpoint.request({
        channel: 'control',
        method: 'runtime/heartbeat',
        contractVersion: '1.0',
        payload: { nonce },
        timeoutMs: Math.max(1, quota.heartbeatIntervalMs - 1),
      });
      heartbeatPending = false;
      const payload = result.ok ? asRecord(result.value) : undefined;
      if (result.ok && payload?.nonce === nonce) {
        heartbeatMisses = 0;
        return;
      }
      heartbeatMisses += 1;
      if (heartbeatMisses >= quota.heartbeatMissLimit) {
        terminate(
          'heartbeat-timeout',
          createPluginDiagnostic(
            PLUGIN_DIAGNOSTIC_CODES.SANDBOX_HEARTBEAT_TIMEOUT,
            'Isolated plugin runtime missed its heartbeat budget.',
            {
              ...meta,
              limit: quota.heartbeatMissLimit,
              actual: heartbeatMisses,
            }
          )
        );
      }
    };
    heartbeatTimer = setInterval(
      () => void heartbeat(),
      quota.heartbeatIntervalMs
    );

    const session: PluginRuntimeSession = Object.freeze({
      deactivate: async (
        reason: RuntimeDeactivationReason,
        deactivationSignal: AbortSignal
      ) => {
        intentionalDeactivation = true;
        if (heartbeatTimer !== undefined) clearInterval(heartbeatTimer);
        const result = terminated
          ? protocolSuccess<JsonValue>({ ok: true, diagnostics: [] })
          : await endpoint.request({
              channel: 'control',
              method: 'runtime/deactivate',
              contractVersion: '1.0',
              payload: { reason },
              timeoutMs: quota.lifecycleTimeoutMs,
              signal: deactivationSignal,
            });
        terminated = true;
        endpoint.close('host-deactivate');
        sandbox.port.removeEventListener('message', onPortMessage);
        sandbox.port.removeEventListener('messageerror', onPortMessageError);
        sandbox.dispose();
        await disposeGateway(gateway);
        terminationListeners.clear();
        if (!result.ok) return result;
        const payload = asRecord(result.value);
        return payload?.ok === true
          ? pluginHostSuccess(undefined)
          : pluginHostFailure([
              createPluginDiagnostic(
                PLUGIN_DIAGNOSTIC_CODES.OWNER_CLEANUP_FAILED,
                'Isolated plugin runtime rejected deactivation.',
                { ...meta, reasonCode: reason }
              ),
            ]);
      },
      onDidTerminate: (listener) => {
        terminationListeners.add(listener);
        let disposed = false;
        return Object.freeze({
          dispose: () => {
            if (disposed) return;
            disposed = true;
            terminationListeners.delete(listener);
          },
        });
      },
    });

    return pluginHostSuccess(session, [
      ...gatewayResult.diagnostics,
      ...sandboxResult.diagnostics,
      ...ready.diagnostics,
      ...activated.diagnostics,
    ]);
  };

  return pluginHostSuccess(Object.freeze({ activate }));
};
