import type { JsonValue } from '@prodivix/plugin-contracts';
import type {
  HostContributionPointMap,
  PluginHostResult,
  PluginRuntimeActivationInput,
} from '@prodivix/plugin-host';

export type BrowserGatewayRequest = Readonly<{
  method: string;
  contractVersion: string;
  payload: JsonValue;
}>;

export type BrowserGatewaySession = Readonly<{
  dispatch(
    request: BrowserGatewayRequest,
    signal: AbortSignal
  ): Promise<PluginHostResult<JsonValue>>;
  dispose(): void | Promise<void>;
}>;

export type BrowserGatewaySessionFactory<
  TMap extends HostContributionPointMap,
> = Readonly<{
  create(
    activation: PluginRuntimeActivationInput<TMap>
  ): Promise<PluginHostResult<BrowserGatewaySession>>;
}>;
