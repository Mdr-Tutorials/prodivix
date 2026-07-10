import type { PluginRuntimeActivationInput } from '@prodivix/plugin-host';
import type { HostContributionPointMap } from '@prodivix/plugin-host';
import type { PluginHostResult } from '@prodivix/plugin-host';

export type RuntimeWorkerBootstrap = Readonly<{
  source: string;
  digest: string;
}>;

export type BrowserRuntimeSandbox = Readonly<{
  port: MessagePort;
  transportId: string;
  dispose(): void;
}>;

export type BrowserRuntimeSandboxStartInput<
  TMap extends HostContributionPointMap,
> = Readonly<{
  activation: PluginRuntimeActivationInput<TMap>;
  workerBootstrap: RuntimeWorkerBootstrap;
  supportedProtocolVersions: readonly string[];
  handshakeTimeoutMs: number;
}>;

export type BrowserRuntimeSandboxFactory = Readonly<{
  start<TMap extends HostContributionPointMap>(
    input: BrowserRuntimeSandboxStartInput<TMap>,
    signal: AbortSignal
  ): Promise<PluginHostResult<BrowserRuntimeSandbox>>;
}>;
