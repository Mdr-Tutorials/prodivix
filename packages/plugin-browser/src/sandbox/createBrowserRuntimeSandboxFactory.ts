import {
  createPluginDiagnostic,
  PLUGIN_DIAGNOSTIC_CODES,
} from '@prodivix/plugin-contracts';
import {
  pluginHostFailure,
  pluginHostSuccess,
  type HostContributionPointMap,
  type PluginHostResult,
} from '@prodivix/plugin-host';
import type {
  BrowserRuntimeSandbox,
  BrowserRuntimeSandboxFactory,
  BrowserRuntimeSandboxStartInput,
} from '#browser/sandbox/sandbox.types';

export type BrowserRuntimeSandboxFactoryOptions = Readonly<{
  sandboxUrl: string;
  window?: Window;
  document?: Document;
  crypto?: Crypto;
}>;

type BootstrapReadyMessage = Readonly<{
  kind: 'prodivix-runtime-bootstrap-ready';
  nonce: string;
  frameId: string;
}>;

const randomToken = (cryptoService: Crypto, byteLength = 24): string => {
  const bytes = cryptoService.getRandomValues(new Uint8Array(byteLength));
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replaceAll('=', '');
};

const isLocalHttpOrigin = (url: URL): boolean =>
  url.protocol === 'http:' &&
  (url.hostname === '127.0.0.1' || url.hostname === 'localhost');

const validateSandboxUrl = (
  source: string,
  hostWindow: Window
): PluginHostResult<URL> => {
  let url: URL;
  try {
    url = new URL(source, hostWindow.location.href);
  } catch {
    return pluginHostFailure([
      createPluginDiagnostic(
        PLUGIN_DIAGNOSTIC_CODES.SANDBOX_POLICY_INVALID,
        'Browser plugin sandbox URL is invalid.'
      ),
    ]);
  }
  if (url.protocol !== 'https:' && !isLocalHttpOrigin(url)) {
    return pluginHostFailure([
      createPluginDiagnostic(
        PLUGIN_DIAGNOSTIC_CODES.SANDBOX_POLICY_INVALID,
        'Browser plugin sandbox must use HTTPS outside local development.',
        { sandboxOrigin: url.origin }
      ),
    ]);
  }
  if (url.origin === hostWindow.location.origin) {
    return pluginHostFailure([
      createPluginDiagnostic(
        PLUGIN_DIAGNOSTIC_CODES.SANDBOX_POLICY_INVALID,
        'Browser plugin sandbox must use a dedicated origin.',
        { sandboxOrigin: url.origin }
      ),
    ]);
  }
  if (url.username || url.password) {
    return pluginHostFailure([
      createPluginDiagnostic(
        PLUGIN_DIAGNOSTIC_CODES.SANDBOX_POLICY_INVALID,
        'Browser plugin sandbox URL must not contain credentials.'
      ),
    ]);
  }
  return pluginHostSuccess(url);
};

const isBootstrapReady = (value: unknown): value is BootstrapReadyMessage => {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }
  const record = value as Record<string, unknown>;
  return (
    Object.keys(record).length === 3 &&
    record.kind === 'prodivix-runtime-bootstrap-ready' &&
    typeof record.nonce === 'string' &&
    typeof record.frameId === 'string'
  );
};

const startSandbox = <TMap extends HostContributionPointMap>(
  options: BrowserRuntimeSandboxFactoryOptions,
  input: BrowserRuntimeSandboxStartInput<TMap>,
  signal: AbortSignal
): Promise<PluginHostResult<BrowserRuntimeSandbox>> => {
  const hostWindow = options.window ?? window;
  const hostDocument = options.document ?? document;
  const cryptoService = options.crypto ?? crypto;
  const urlResult = validateSandboxUrl(options.sandboxUrl, hostWindow);
  if (!urlResult.ok) return Promise.resolve(urlResult);
  const nonce = randomToken(cryptoService);
  const frameId = randomToken(cryptoService, 16);
  const transportId = randomToken(cryptoService, 16);
  const url = new URL(urlResult.value);
  url.hash = new URLSearchParams({ nonce, frameId }).toString();

  return new Promise((resolve) => {
    const iframe = hostDocument.createElement('iframe');
    iframe.hidden = true;
    iframe.tabIndex = -1;
    iframe.referrerPolicy = 'no-referrer';
    iframe.sandbox.add('allow-scripts');
    iframe.setAttribute('allow', '');
    iframe.setAttribute('credentialless', '');
    iframe.src = url.href;
    let settled = false;

    const cleanupListeners = () => {
      clearTimeout(timeoutId);
      hostWindow.removeEventListener('message', onMessage);
      signal.removeEventListener('abort', onAbort);
      iframe.removeEventListener('error', onFrameError);
    };
    const fail = (message: string, reasonCode: string) => {
      if (settled) return;
      settled = true;
      cleanupListeners();
      iframe.remove();
      resolve(
        pluginHostFailure([
          createPluginDiagnostic(
            PLUGIN_DIAGNOSTIC_CODES.SANDBOX_BOOTSTRAP_FAILED,
            message,
            {
              pluginId: input.activation.owner.pluginId,
              pluginVersion: input.activation.manifest.version,
              installationId: input.activation.owner.installationId,
              generation: input.activation.owner.generation,
              operationId: input.activation.operationId,
              reasonCode,
              sandboxOrigin: url.origin,
            }
          ),
        ])
      );
    };
    const onAbort = () => fail('Sandbox startup was canceled.', 'aborted');
    const onFrameError = () =>
      fail('Sandbox broker failed to load.', 'broker-load-failed');
    const onMessage = (event: MessageEvent) => {
      if (
        event.source !== iframe.contentWindow ||
        event.origin !== 'null' ||
        !isBootstrapReady(event.data) ||
        event.data.nonce !== nonce ||
        event.data.frameId !== frameId
      ) {
        return;
      }
      const target = iframe.contentWindow;
      if (!target) {
        fail('Sandbox broker window is unavailable.', 'broker-window-missing');
        return;
      }
      const channel = new MessageChannel();
      const runtimeBytes =
        input.activation.runtimeArtifact.bytes.slice().buffer;
      try {
        target.postMessage(
          {
            kind: 'prodivix-runtime-bootstrap',
            nonce,
            frameId,
            workerBootstrapSource: input.workerBootstrap.source,
            workerBootstrapDigest: input.workerBootstrap.digest,
            runtimeBytes,
            runtimeDigest: input.activation.runtimeArtifact.digest,
            supportedProtocolVersions: input.supportedProtocolVersions,
            context: {
              pluginId: input.activation.owner.pluginId,
              pluginVersion: input.activation.manifest.version,
              sessionToken: input.activation.sessionToken,
              operationId: input.activation.operationId,
            },
          },
          '*',
          [channel.port2, runtimeBytes]
        );
      } catch {
        channel.port1.close();
        channel.port2.close();
        fail('Sandbox bootstrap transfer failed.', 'bootstrap-transfer-failed');
        return;
      }
      settled = true;
      cleanupListeners();
      let disposed = false;
      resolve(
        pluginHostSuccess(
          Object.freeze({
            port: channel.port1,
            transportId,
            dispose: () => {
              if (disposed) return;
              disposed = true;
              channel.port1.close();
              iframe.remove();
            },
          })
        )
      );
    };
    const timeoutId = setTimeout(
      () => fail('Sandbox broker handshake timed out.', 'bootstrap-timeout'),
      input.handshakeTimeoutMs
    );
    hostWindow.addEventListener('message', onMessage);
    signal.addEventListener('abort', onAbort, { once: true });
    iframe.addEventListener('error', onFrameError, { once: true });
    hostDocument.body.append(iframe);
    if (signal.aborted) onAbort();
  });
};

export const createBrowserRuntimeSandboxFactory = (
  options: BrowserRuntimeSandboxFactoryOptions
): BrowserRuntimeSandboxFactory =>
  Object.freeze({
    start: (input, signal) => startSandbox(options, input, signal),
  });
