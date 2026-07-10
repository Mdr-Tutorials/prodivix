import type { JsonValue } from '@prodivix/plugin-contracts';
import type {
  CapabilityIdentity,
  PluginHostResult,
  PluginOwnerRef,
} from '@prodivix/plugin-host';

export type GatewayContractIdentity = Readonly<{
  method: string;
  contractVersion: string;
}>;

export type GatewayAuditMode = 'best-effort' | 'required-before-effect';

export type GatewayAuditMetadataValue = string | number | boolean | null;

export type GatewayAuditMetadata = Readonly<
  Record<string, GatewayAuditMetadataValue>
>;

export type GatewayExecutionContext = Readonly<{
  owner: PluginOwnerRef;
  pluginVersion: string;
  operationId: string;
  sessionToken: string;
  permissionRevision: number;
  capability?: CapabilityIdentity;
  signal: AbortSignal;
  assertActive(): PluginHostResult<void>;
}>;

export type GatewayContractLimits = Readonly<{
  timeoutMs: number;
  maxRequestBytes: number;
  maxResponseBytes: number;
  requestsPerSecond: number;
  requestBurst: number;
  maxConcurrency: number;
}>;

export type GatewayContract = GatewayContractIdentity &
  Readonly<{
    limits: GatewayContractLimits;
    auditMode: GatewayAuditMode;
    validateRequest(value: JsonValue): PluginHostResult<JsonValue>;
    validateResponse(value: JsonValue): PluginHostResult<JsonValue>;
    requiredCapability(request: JsonValue): CapabilityIdentity | undefined;
    auditMetadata?(
      request: JsonValue,
      response?: JsonValue
    ): GatewayAuditMetadata;
    execute(
      context: GatewayExecutionContext,
      request: JsonValue
    ): Promise<PluginHostResult<JsonValue>>;
  }>;

export type GatewayContractDefinition<
  TRequest extends JsonValue,
  TResponse extends JsonValue,
> = GatewayContractIdentity &
  Readonly<{
    limits: GatewayContractLimits;
    auditMode: GatewayAuditMode;
    validateRequest(value: JsonValue): PluginHostResult<TRequest>;
    validateResponse(value: JsonValue): PluginHostResult<TResponse>;
    requiredCapability(request: TRequest): CapabilityIdentity | undefined;
    auditMetadata?(
      request: TRequest,
      response?: TResponse
    ): GatewayAuditMetadata;
    execute(
      context: GatewayExecutionContext,
      request: TRequest
    ): Promise<PluginHostResult<TResponse>>;
  }>;

export const gatewayContractKey = (identity: GatewayContractIdentity): string =>
  JSON.stringify([identity.method, identity.contractVersion]);

export const defineGatewayContract = <
  TRequest extends JsonValue,
  TResponse extends JsonValue,
>(
  definition: GatewayContractDefinition<TRequest, TResponse>
): GatewayContract =>
  Object.freeze({
    method: definition.method,
    contractVersion: definition.contractVersion,
    limits: Object.freeze({ ...definition.limits }),
    auditMode: definition.auditMode,
    validateRequest: (value) => definition.validateRequest(value),
    validateResponse: (value) => definition.validateResponse(value),
    requiredCapability: (request) =>
      definition.requiredCapability(request as TRequest),
    ...(definition.auditMetadata
      ? {
          auditMetadata: (request: JsonValue, response?: JsonValue) =>
            definition.auditMetadata!(
              request as TRequest,
              response as TResponse | undefined
            ),
        }
      : {}),
    execute: (context, request) =>
      definition.execute(context, request as TRequest),
  });
