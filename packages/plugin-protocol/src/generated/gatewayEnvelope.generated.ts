/* eslint-disable */
/**
 * Generated from specs/plugins/runtime/gateway-envelope-v1.schema.json.
 * DO NOT EDIT. Run `pnpm --filter @prodivix/plugin-protocol generate`.
 */

/**
 * Phase 4 capability-scoped Host Gateway payload contracts.
 */
export type GatewayContractMessageV1 =
  | HealthPingRequest
  | HealthPingResponse
  | TelemetryEmitRequest
  | TelemetryEmitResponse
  | WorkspaceReadSummaryRequest
  | WorkspaceReadSummaryResponse
  | WorkspaceDispatchIntentRequest
  | WorkspaceDispatchIntentResponse
  | DocumentReadRequest
  | DocumentReadResponse
  | DocumentApplyPatchRequest
  | DocumentApplyPatchResponse
  | NetworkRequestRequest
  | NetworkRequestResponse;
export type HealthPingRequest = ContractMessage & {
  kind?: 'request';
  method?: 'runtime.health/ping';
  payload?: {
    nonce: string;
  };
  [k: string]: unknown;
};
export type HealthPingResponse = ContractMessage & {
  kind?: 'response';
  method?: 'runtime.health/ping';
  payload?:
    | {
        ok: true;
        result: {
          nonce: string;
        };
      }
    | GatewayFailure;
  [k: string]: unknown;
};
export type TelemetryEmitRequest = ContractMessage & {
  kind?: 'request';
  method?: 'telemetry/emit';
  payload?: {
    name: string;
    level: 'debug' | 'info' | 'warning' | 'error';
    attributes?: StringMap;
  };
  [k: string]: unknown;
};
export type TelemetryEmitResponse = ContractMessage & {
  kind?: 'response';
  method?: 'telemetry/emit';
  payload?:
    | {
        ok: true;
        result: {
          accepted: true;
        };
      }
    | GatewayFailure;
  [k: string]: unknown;
};
export type WorkspaceReadSummaryRequest = ContractMessage & {
  kind?: 'request';
  method?: 'workspace/read-summary';
  payload?: {};
  [k: string]: unknown;
};
export type WorkspaceReadSummaryResponse = ContractMessage & {
  kind?: 'response';
  method?: 'workspace/read-summary';
  payload?:
    | {
        ok: true;
        result: {
          workspaceId: string;
          revision: Revision;
          documentCount: number;
          routeCount: number;
          componentCount: number;
        };
      }
    | GatewayFailure;
  [k: string]: unknown;
};
export type Revision = number;
export type WorkspaceDispatchIntentRequest = ContractMessage & {
  kind?: 'request';
  method?: 'workspace/dispatch-intent';
  payload?: {
    intentId: string;
    payload: import('@prodivix/plugin-contracts').JsonValue;
    expectedRevision?: Revision;
  };
  [k: string]: unknown;
};
export type WorkspaceDispatchIntentResponse = ContractMessage & {
  kind?: 'response';
  method?: 'workspace/dispatch-intent';
  payload?:
    | {
        ok: true;
        result: {
          accepted: true;
          operationId: string;
          revision: Revision;
        };
      }
    | GatewayFailure;
  [k: string]: unknown;
};
export type DocumentReadRequest = ContractMessage & {
  kind?: 'request';
  method?: 'document/read';
  payload?: {
    documentId: string;
    scope: Scope;
  };
  [k: string]: unknown;
};
export type Scope = string;
export type DocumentReadResponse = ContractMessage & {
  kind?: 'response';
  method?: 'document/read';
  payload?:
    | {
        ok: true;
        result: {
          documentId: string;
          revision: Revision;
          content: import('@prodivix/plugin-contracts').JsonValue;
        };
      }
    | GatewayFailure;
  [k: string]: unknown;
};
export type DocumentApplyPatchRequest = ContractMessage & {
  kind?: 'request';
  method?: 'document/apply-patch';
  payload?: {
    documentId: string;
    scope: Scope;
    baseRevision: Revision;
    patch: import('@prodivix/plugin-contracts').JsonValue;
  };
  [k: string]: unknown;
};
export type DocumentApplyPatchResponse = ContractMessage & {
  kind?: 'response';
  method?: 'document/apply-patch';
  payload?:
    | {
        ok: true;
        result: {
          documentId: string;
          revision: Revision;
          applied: true;
        };
      }
    | GatewayFailure;
  [k: string]: unknown;
};
export type NetworkRequestRequest = ContractMessage & {
  kind?: 'request';
  method?: 'network/request';
  payload?: {
    scope: Scope;
    url: string;
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    headers?: StringMap;
    body?: string;
  };
  [k: string]: unknown;
};
export type NetworkRequestResponse = ContractMessage & {
  kind?: 'response';
  method?: 'network/request';
  payload?:
    | {
        ok: true;
        result: {
          url: string;
          status: number;
          headers: StringMap;
          body: string;
          bodyBytes: number;
          redirected: boolean;
        };
      }
    | GatewayFailure;
  [k: string]: unknown;
};

export interface ContractMessage {
  kind: 'request' | 'response';
  method: string;
  contractVersion: '1.0';
  payload: unknown;
}
export interface GatewayFailure {
  ok: false;
  /**
   * @minItems 1
   * @maxItems 16
   */
  diagnostics: SafeDiagnostic[];
}
export interface SafeDiagnostic {
  code: string;
  message: string;
  meta?: {
    [k: string]: null | boolean | number | string;
  };
}
export interface StringMap {
  [k: string]: string;
}
