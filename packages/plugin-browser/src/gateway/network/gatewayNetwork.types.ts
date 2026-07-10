import type { PluginHostResult } from '@prodivix/plugin-host';
import type { GatewayExecutionContext } from '#browser/gateway/gatewayContract';

export type GatewayNetworkMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type GatewayNetworkRequest = Readonly<{
  scope: string;
  url: string;
  method: GatewayNetworkMethod;
  headers?: Readonly<Record<string, string>>;
  body?: string;
}>;

export type GatewayNetworkResponse = Readonly<{
  url: string;
  status: number;
  headers: Readonly<Record<string, string>>;
  body: string;
  bodyBytes: number;
  redirected: boolean;
}>;

export type GatewayNetworkScopePolicy = Readonly<{
  scope: string;
  allowedOrigins: readonly string[];
  allowedMethods: readonly GatewayNetworkMethod[];
  allowedPathPrefixes: readonly string[];
  allowedRequestHeaders?: readonly string[];
  allowedResponseContentTypes: readonly string[];
  maxRequestBytes: number;
  maxResponseBytes: number;
  timeoutMs: number;
  maxRedirects: number;
}>;

export type GatewayNetworkPolicyResolver = Readonly<{
  resolve(scope: string): GatewayNetworkScopePolicy | undefined;
}>;

export type GatewayNetworkAdapter = Readonly<{
  request(
    context: GatewayExecutionContext,
    request: GatewayNetworkRequest
  ): Promise<PluginHostResult<GatewayNetworkResponse>>;
}>;

export type CreateGatewayNetworkAdapterOptions = Readonly<{
  policy: GatewayNetworkPolicyResolver;
  fetch?: typeof globalThis.fetch;
}>;
