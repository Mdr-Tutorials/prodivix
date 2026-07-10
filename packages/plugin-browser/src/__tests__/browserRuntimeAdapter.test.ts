import { createHash } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';
import type {
  ActivationEvent,
  JsonValue,
  PluginManifestV1,
} from '@prodivix/plugin-contracts';
import {
  createPluginDiagnostic,
  PLUGIN_DIAGNOSTIC_CODES,
} from '@prodivix/plugin-contracts';
import {
  createPluginOwnerRef,
  pluginHostFailure,
  pluginHostSuccess,
  type HostContributionPointMap,
  type PluginRuntimeActivationInput,
  type RuntimeDeactivationReason,
} from '@prodivix/plugin-host';
import {
  BUILT_IN_PROTOCOL_CONTRACTS,
  createProtocolContractRegistry,
  createProtocolEndpoint,
  protocolSuccess,
  type ProtocolEndpoint,
} from '@prodivix/plugin-protocol';
import {
  createBrowserPluginRuntimeAdapter,
  RUNTIME_WORKER_BOOTSTRAP_DIGEST,
  RUNTIME_WORKER_BOOTSTRAP_SOURCE,
  type BrowserRuntimeSandboxFactory,
  type BrowserRuntimeSandboxStartInput,
} from '#browser/index';

type TestContributionMap = HostContributionPointMap;

const createManifest = (): PluginManifestV1 => ({
  schemaVersion: '1.0',
  id: '@test/runtime',
  displayName: 'Runtime fixture',
  version: '1.0.0',
  publisher: 'test',
  engines: { prodivix: '^0.1.0' },
  entrypoints: { runtime: { path: 'dist/runtime.js' } },
  capabilities: [],
  contributes: [],
});

const createActivation =
  (): PluginRuntimeActivationInput<TestContributionMap> => {
    const manifest = createManifest();
    const owner = createPluginOwnerRef(manifest.id, 'installation-1', 1);
    return {
      owner,
      manifest,
      runtimeArtifact: {
        path: 'dist/runtime.js',
        bytes: new TextEncoder().encode('export const activate = () => {};'),
        digest: 'sha256-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
        packageDigest: 'sha256-package-fixture',
      },
      event: { type: 'manual' } satisfies ActivationEvent,
      operationId: 'operation-1',
      sessionToken: 'session-1',
      permission: {
        getSnapshot: () => undefined,
        isGranted: () => false,
        subscribe: () => ({ dispose: () => {} }),
      },
      contributions: {
        stage: () => pluginHostSuccess(undefined),
      },
    };
  };

type RuntimeHarness = Readonly<{
  sandboxFactory: BrowserRuntimeSandboxFactory;
  getRuntimeEndpoint(): ProtocolEndpoint | undefined;
  postRaw(value: unknown): void;
  deactivationReasons: RuntimeDeactivationReason[];
  starts: BrowserRuntimeSandboxStartInput<TestContributionMap>[];
  setHeartbeatEnabled(value: boolean): void;
}>;

const createRuntimeHarness = (): RuntimeHarness => {
  const registered = createProtocolContractRegistry(
    BUILT_IN_PROTOCOL_CONTRACTS
  );
  if (!registered.ok) throw new Error('Expected protocol contracts.');
  let runtimeEndpoint: ProtocolEndpoint | undefined;
  let runtimePort: MessagePort | undefined;
  let heartbeatEnabled = true;
  const deactivationReasons: RuntimeDeactivationReason[] = [];
  const starts: BrowserRuntimeSandboxStartInput<TestContributionMap>[] = [];
  const sandboxFactory: BrowserRuntimeSandboxFactory = {
    start: async (input) => {
      starts.push(
        input as BrowserRuntimeSandboxStartInput<TestContributionMap>
      );
      const channel = new MessageChannel();
      runtimePort = channel.port2;
      runtimeEndpoint = createProtocolEndpoint({
        contracts: registered.value,
        messagePrefix: 'runtime',
        sendText: (text) => channel.port2.postMessage(text),
        onRequest: async (request) => {
          if (request.method === 'runtime/heartbeat') {
            if (!heartbeatEnabled) return new Promise(() => {});
            return protocolSuccess(request.payload);
          }
          if (request.method === 'runtime/deactivate') {
            const payload = request.payload as {
              reason: RuntimeDeactivationReason;
            };
            deactivationReasons.push(payload.reason);
          }
          return protocolSuccess<JsonValue>({ ok: true, diagnostics: [] });
        },
      });
      channel.port2.addEventListener('message', (event) => {
        void runtimeEndpoint!.receive(event.data);
      });
      channel.port2.start();
      queueMicrotask(() => {
        runtimeEndpoint!.sendEvent({
          channel: 'control',
          method: 'runtime/ready',
          contractVersion: '1.0',
          payload: {
            selectedProtocolVersion: '1.0',
            runtimeDigest: input.activation.runtimeArtifact.digest,
          },
        });
      });
      return pluginHostSuccess({
        port: channel.port1,
        transportId: 'transport-1',
        dispose: () => {
          channel.port1.close();
          channel.port2.close();
        },
      });
    },
  };
  return {
    sandboxFactory,
    getRuntimeEndpoint: () => runtimeEndpoint,
    postRaw: (value) => runtimePort?.postMessage(value),
    deactivationReasons,
    starts,
    setHeartbeatEnabled: (value) => {
      heartbeatEnabled = value;
    },
  };
};

describe('browser plugin runtime adapter', () => {
  it('binds the generated Worker bootstrap and deactivates with the Host reason', async () => {
    const harness = createRuntimeHarness();
    const created = createBrowserPluginRuntimeAdapter<TestContributionMap>({
      sandboxFactory: harness.sandboxFactory,
      quotaPolicy: { heartbeatIntervalMs: 10_000 },
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    const activated = await created.value.activate(
      createActivation(),
      new AbortController().signal
    );
    expect(activated.ok).toBe(true);
    if (!activated.ok) return;
    expect(harness.starts[0]?.workerBootstrap.digest).toBe(
      RUNTIME_WORKER_BOOTSTRAP_DIGEST
    );

    const deactivated = await activated.value.deactivate(
      'host-shutdown',
      new AbortController().signal
    );

    expect(deactivated.ok).toBe(true);
    expect(harness.deactivationReasons).toEqual(['host-shutdown']);
  });

  it('terminates an active session on malformed protocol input', async () => {
    const harness = createRuntimeHarness();
    const created = createBrowserPluginRuntimeAdapter<TestContributionMap>({
      sandboxFactory: harness.sandboxFactory,
      quotaPolicy: { heartbeatIntervalMs: 10_000 },
    });
    if (!created.ok) throw new Error('Expected browser adapter.');
    const activated = await created.value.activate(
      createActivation(),
      new AbortController().signal
    );
    if (!activated.ok) throw new Error('Expected runtime activation.');
    const termination = vi.fn();
    activated.value.onDidTerminate(termination);

    harness.postRaw('{"invalid":');
    await vi.waitFor(() => expect(termination).toHaveBeenCalledOnce());

    expect(termination).toHaveBeenCalledWith({
      sessionToken: 'session-1',
      reasonCode: 'protocol-violation',
    });
  });

  it('redacts Host service messages before returning Gateway diagnostics to runtime', async () => {
    const harness = createRuntimeHarness();
    const created = createBrowserPluginRuntimeAdapter<TestContributionMap>({
      sandboxFactory: harness.sandboxFactory,
      gatewaySessionFactory: {
        create: async () =>
          pluginHostSuccess({
            dispatch: async () =>
              pluginHostFailure([
                createPluginDiagnostic(
                  PLUGIN_DIAGNOSTIC_CODES.GATEWAY_HANDLER_FAILED,
                  'Bearer private-token must never cross the sandbox boundary.'
                ),
              ]),
            dispose: () => {},
          }),
      },
      quotaPolicy: { heartbeatIntervalMs: 10_000 },
    });
    if (!created.ok) throw new Error('Expected browser adapter.');
    const activated = await created.value.activate(
      createActivation(),
      new AbortController().signal
    );
    if (!activated.ok) throw new Error('Expected runtime activation.');

    const response = await harness.getRuntimeEndpoint()!.request({
      channel: 'gateway',
      method: 'telemetry/emit',
      contractVersion: '1.0',
      payload: { name: 'fixture.event', level: 'info' },
    });

    expect(response).toMatchObject({
      ok: true,
      value: {
        ok: false,
        diagnostics: [
          {
            code: 'PLG-4037',
            message: 'Host Gateway request failed.',
          },
        ],
      },
    });
    expect(JSON.stringify(response)).not.toMatch(/bearer|private-token/i);
    await activated.value.deactivate('manual', new AbortController().signal);
  });

  it('terminates an unresponsive runtime after its heartbeat budget', async () => {
    const harness = createRuntimeHarness();
    const created = createBrowserPluginRuntimeAdapter<TestContributionMap>({
      sandboxFactory: harness.sandboxFactory,
      quotaPolicy: {
        heartbeatIntervalMs: 10,
        heartbeatMissLimit: 2,
      },
    });
    if (!created.ok) throw new Error('Expected browser adapter.');
    const activated = await created.value.activate(
      createActivation(),
      new AbortController().signal
    );
    if (!activated.ok) throw new Error('Expected runtime activation.');
    harness.setHeartbeatEnabled(false);
    const termination = vi.fn();
    activated.value.onDidTerminate(termination);

    await vi.waitFor(
      () =>
        expect(termination).toHaveBeenCalledWith({
          sessionToken: 'session-1',
          reasonCode: 'heartbeat-timeout',
        }),
      { timeout: 1_000 }
    );
  });

  it('terminates a runtime that exceeds the inbound message burst', async () => {
    const harness = createRuntimeHarness();
    const created = createBrowserPluginRuntimeAdapter<TestContributionMap>({
      sandboxFactory: harness.sandboxFactory,
      quotaPolicy: {
        heartbeatIntervalMs: 10_000,
        messagesPerSecond: 1,
        messageBurst: 3,
      },
    });
    if (!created.ok) throw new Error('Expected browser adapter.');
    const activated = await created.value.activate(
      createActivation(),
      new AbortController().signal
    );
    if (!activated.ok) throw new Error('Expected runtime activation.');
    const termination = vi.fn();
    activated.value.onDidTerminate(termination);

    for (let index = 0; index < 2; index += 1) {
      harness.getRuntimeEndpoint()?.sendEvent({
        channel: 'control',
        method: 'runtime/ready',
        contractVersion: '1.0',
        payload: {
          selectedProtocolVersion: '1.0',
          runtimeDigest: 'sha256-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
        },
      });
    }
    await vi.waitFor(() => expect(termination).toHaveBeenCalledOnce());

    expect(termination.mock.calls[0]?.[0].reasonCode).toBe(
      'message-rate-quota'
    );
  });

  it('ships a bootstrap source matching its build digest', () => {
    const digest = `sha256-${createHash('sha256')
      .update(RUNTIME_WORKER_BOOTSTRAP_SOURCE)
      .digest('base64')}`;

    expect(digest).toBe(RUNTIME_WORKER_BOOTSTRAP_DIGEST);
  });
});
