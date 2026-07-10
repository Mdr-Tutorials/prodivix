import type { JsonValue } from '@prodivix/plugin-contracts';
import {
  BUILT_IN_PROTOCOL_CONTRACTS,
  createProtocolContractRegistry,
  createProtocolEndpoint,
  protocolFailure,
  protocolSuccess,
  type ProtocolEndpoint,
  type ProtocolRequest,
} from '@prodivix/plugin-protocol';

type RuntimeBootstrapMessage = Readonly<{
  kind: 'prodivix-runtime-worker-bootstrap';
  runtimeBytes: ArrayBuffer;
  runtimeDigest: string;
  supportedProtocolVersions: readonly string[];
  context: Readonly<{
    pluginId: string;
    pluginVersion: string;
    sessionToken: string;
    operationId: string;
  }>;
  port: MessagePort;
}>;

type PluginRuntimeContext = Readonly<{
  plugin: Readonly<{ id: string; version: string }>;
  activationEvent: JsonValue;
  gateway: Readonly<{
    request(
      method: string,
      payload: JsonValue,
      options?: Readonly<{ contractVersion?: string; timeoutMs?: number }>
    ): Promise<JsonValue>;
  }>;
  implementations: Readonly<{
    bind(
      contributionId: string,
      implementationId: string,
      methods: Readonly<
        Record<string, (input: JsonValue, signal: AbortSignal) => unknown>
      >
    ): void;
  }>;
}>;

type RuntimeModule = Readonly<{
  version?: string;
  activate(context: PluginRuntimeContext): unknown;
  deactivate?(reason: string): unknown;
}>;

type ImplementationBinding = Readonly<{
  contributionId: string;
  implementationId: string;
  methods: Readonly<
    Record<string, (input: JsonValue, signal: AbortSignal) => unknown>
  >;
}>;

const workerScope = self as unknown as DedicatedWorkerGlobalScope;
let endpoint: ProtocolEndpoint | undefined;
let runtimeModule: RuntimeModule | undefined;
let activationHandle: unknown;
let runtimeContext: RuntimeBootstrapMessage['context'] | undefined;
const implementationBindings = new Map<string, ImplementationBinding>();

const asRecord = (value: unknown): Record<string, unknown> | undefined =>
  typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;

const disableGlobal = (name: string): void => {
  try {
    Object.defineProperty(workerScope, name, {
      configurable: false,
      enumerable: false,
      value: undefined,
      writable: false,
    });
  } catch {
    // CSP and opaque-origin policy remain the authority when a platform slot is immutable.
  }
};

const hardenRuntimeGlobals = (): void => {
  for (const name of [
    'fetch',
    'WebSocket',
    'EventSource',
    'XMLHttpRequest',
    'WebTransport',
    'Worker',
    'SharedWorker',
    'importScripts',
    'indexedDB',
    'caches',
  ]) {
    disableGlobal(name);
  }
};

const bindingKey = (contributionId: string, implementationId: string) =>
  `${contributionId}\u0000${implementationId}`;

const safeOperationFailure = (message: string) =>
  protocolSuccess<JsonValue>({
    ok: false,
    diagnostics: [{ code: 'PLG-4002', message }],
  });

const handleImplementationInvoke = async (
  request: ProtocolRequest,
  signal: AbortSignal
) => {
  const payload = asRecord(request.payload);
  const contributionId = payload?.contributionId;
  const implementationId = payload?.implementationId;
  const method = payload?.method;
  if (
    typeof contributionId !== 'string' ||
    typeof implementationId !== 'string' ||
    typeof method !== 'string'
  ) {
    return protocolSuccess<JsonValue>({
      ok: false,
      errorCode: 'PLG-4050',
    });
  }
  const binding = implementationBindings.get(
    bindingKey(contributionId, implementationId)
  );
  const implementation = binding?.methods[method];
  if (!implementation) {
    return protocolSuccess<JsonValue>({
      ok: false,
      errorCode: 'PLG-4050',
    });
  }
  try {
    const value = await implementation(
      (payload.arguments ?? null) as JsonValue,
      signal
    );
    return protocolSuccess<JsonValue>({
      ok: true,
      value: (value ?? null) as JsonValue,
    });
  } catch {
    return protocolSuccess<JsonValue>({
      ok: false,
      errorCode: 'PLG-4051',
    });
  }
};

const handleControlRequest = async (
  request: ProtocolRequest,
  signal: AbortSignal
) => {
  if (request.method === 'runtime/heartbeat') {
    return protocolSuccess(request.payload);
  }
  if (request.method === 'runtime/activate') {
    const payload = asRecord(request.payload);
    try {
      const context = runtimeContext!;
      const pluginRuntimeContext: PluginRuntimeContext = Object.freeze({
        plugin: Object.freeze({
          id: context.pluginId,
          version: context.pluginVersion,
        }),
        activationEvent: (payload?.event ?? null) as JsonValue,
        gateway: Object.freeze({
          request: async (method, gatewayPayload, options = {}) => {
            const result = await endpoint!.request({
              channel: 'gateway',
              method,
              contractVersion: options.contractVersion ?? '1.0',
              payload: gatewayPayload,
              timeoutMs: options.timeoutMs,
              signal,
            });
            if (!result.ok) throw new Error('Gateway request failed.');
            const response = asRecord(result.value);
            if (response?.ok !== true) {
              throw new Error('Gateway request was denied.');
            }
            return (response.result ?? null) as JsonValue;
          },
        }),
        implementations: Object.freeze({
          bind: (contributionId, implementationId, methods) => {
            const binding = Object.freeze({
              contributionId,
              implementationId,
              methods: Object.freeze({ ...methods }),
            });
            implementationBindings.set(
              bindingKey(contributionId, implementationId),
              binding
            );
            const sent = endpoint!.sendEvent({
              channel: 'implementation',
              method: 'implementation/bind',
              contractVersion: '1.0',
              payload: {
                contributionId,
                implementationId,
                methods: Object.keys(methods).map((method) => ({
                  method,
                  contractVersion: '1.0',
                  required: true,
                })),
              },
            });
            if (!sent.ok) {
              implementationBindings.delete(
                bindingKey(contributionId, implementationId)
              );
              throw new Error('Implementation binding was rejected.');
            }
          },
        }),
      });
      activationHandle = await runtimeModule!.activate(pluginRuntimeContext);
      return protocolSuccess<JsonValue>({ ok: true, diagnostics: [] });
    } catch {
      return safeOperationFailure('Plugin runtime activation failed.');
    }
  }
  if (request.method === 'runtime/deactivate') {
    const payload = asRecord(request.payload);
    try {
      const handle = asRecord(activationHandle);
      if (typeof handle?.dispose === 'function') await handle.dispose();
      if (runtimeModule?.deactivate) {
        await runtimeModule.deactivate(
          typeof payload?.reason === 'string' ? payload.reason : 'manual'
        );
      }
      activationHandle = undefined;
      for (const binding of implementationBindings.values()) {
        endpoint!.sendEvent({
          channel: 'implementation',
          method: 'implementation/unbind',
          contractVersion: '1.0',
          payload: {
            contributionId: binding.contributionId,
            implementationId: binding.implementationId,
          },
        });
      }
      implementationBindings.clear();
      return protocolSuccess<JsonValue>({ ok: true, diagnostics: [] });
    } catch {
      return safeOperationFailure('Plugin runtime deactivation failed.');
    }
  }
  return protocolFailure([
    {
      code: 'PLG-4021',
      severity: 'error',
      domain: 'plugin',
      message: 'Unknown runtime control request.',
      hint: 'Use an exact registered runtime control method.',
      docsUrl: '/reference/diagnostics/plg-4021',
      retryable: false,
      meta: { stage: 'protocol' },
    },
  ]);
};

const startRuntime = async (
  message: RuntimeBootstrapMessage,
  port: MessagePort
): Promise<void> => {
  if (!message.supportedProtocolVersions.includes('1.0')) {
    port.close();
    return;
  }
  const runtimeBytes = new Uint8Array(message.runtimeBytes);
  const source = new TextDecoder('utf-8', { fatal: true }).decode(runtimeBytes);
  hardenRuntimeGlobals();
  const runtimeUrl = URL.createObjectURL(
    new Blob([source], { type: 'text/javascript' })
  );
  try {
    const imported = (await import(/* @vite-ignore */ runtimeUrl)) as Record<
      string,
      unknown
    >;
    const candidate = asRecord(imported.default) ?? imported;
    if (typeof candidate.activate !== 'function') {
      port.close();
      return;
    }
    runtimeModule = candidate as unknown as RuntimeModule;
  } finally {
    URL.revokeObjectURL(runtimeUrl);
  }
  runtimeContext = message.context;
  const registered = createProtocolContractRegistry(
    BUILT_IN_PROTOCOL_CONTRACTS
  );
  if (!registered.ok) {
    port.close();
    return;
  }
  endpoint = createProtocolEndpoint({
    contracts: registered.value,
    messagePrefix: `runtime-${message.context.sessionToken}`,
    sendText: (text) => port.postMessage(text),
    onRequest: (request, signal) =>
      request.channel === 'control'
        ? handleControlRequest(request, signal)
        : request.channel === 'implementation'
          ? handleImplementationInvoke(request, signal)
          : Promise.resolve(
              protocolFailure([
                {
                  code: 'PLG-4021',
                  severity: 'error',
                  domain: 'plugin',
                  message: 'Runtime cannot handle Host Gateway requests.',
                  hint: 'Send Gateway requests from runtime to Host only.',
                  docsUrl: '/reference/diagnostics/plg-4021',
                  retryable: false,
                  meta: { stage: 'protocol' },
                },
              ])
            ),
    onFatal: () => port.close(),
  });
  port.addEventListener('message', (event) => {
    void endpoint!.receive(event.data);
  });
  port.start();
  const ready = endpoint.sendEvent({
    channel: 'control',
    method: 'runtime/ready',
    contractVersion: '1.0',
    payload: {
      selectedProtocolVersion: '1.0',
      runtimeDigest: message.runtimeDigest,
      ...(runtimeModule.version
        ? { runtimeModuleVersion: runtimeModule.version }
        : {}),
    },
  });
  if (!ready.ok) port.close();
};

workerScope.addEventListener(
  'message',
  (event: MessageEvent<RuntimeBootstrapMessage>) => {
    const message = event.data;
    const port = message?.port ?? event.ports[0];
    if (
      !port ||
      message?.kind !== 'prodivix-runtime-worker-bootstrap' ||
      !(message.runtimeBytes instanceof ArrayBuffer) ||
      typeof message.runtimeDigest !== 'string' ||
      !(port instanceof MessagePort) ||
      !Array.isArray(message.supportedProtocolVersions) ||
      !asRecord(message.context)
    ) {
      port?.close();
      return;
    }
    void startRuntime(message, port).catch(() => port.close());
  },
  { once: true }
);

workerScope.addEventListener('error', () => {
  endpoint?.sendEvent({
    channel: 'control',
    method: 'runtime/error',
    contractVersion: '1.0',
    payload: {
      reasonCode: 'uncaught-runtime-error',
      safeMessage: 'Plugin runtime terminated after an uncaught error.',
    },
  });
});

workerScope.addEventListener('unhandledrejection', () => {
  endpoint?.sendEvent({
    channel: 'control',
    method: 'runtime/error',
    contractVersion: '1.0',
    payload: {
      reasonCode: 'unhandled-runtime-rejection',
      safeMessage: 'Plugin runtime terminated after an unhandled rejection.',
    },
  });
});
