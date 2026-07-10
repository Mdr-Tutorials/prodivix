/* eslint-disable */
/**
 * Generated from specs/plugins/runtime/runtime-control-v1.schema.json.
 * DO NOT EDIT. Run `pnpm --filter @prodivix/plugin-protocol generate`.
 */

/**
 * Control-channel payload contracts for Prodivix plugin runtime lifecycle.
 */
export type RuntimeControlMessageV1 =
  | RuntimeReadyEvent
  | RuntimeActivateRequest
  | RuntimeActivateResponse
  | RuntimeDeactivateRequest
  | RuntimeDeactivateResponse
  | RuntimeHeartbeatRequest
  | RuntimeHeartbeatResponse
  | RuntimeCancelEvent
  | RuntimeErrorEvent;
export type RuntimeReadyEvent = ContractMessage & {
  kind?: 'event';
  method?: 'runtime/ready';
  payload?: {
    selectedProtocolVersion: '1.0';
    runtimeDigest: string;
    runtimeModuleVersion?: string;
  };
  [k: string]: unknown;
};
export type RuntimeActivateRequest = ContractMessage & {
  kind?: 'request';
  method?: 'runtime/activate';
  payload?: {
    event: import('@prodivix/plugin-contracts').JsonValue;
  };
  [k: string]: unknown;
};
export type RuntimeActivateResponse = ContractMessage & {
  kind?: 'response';
  method?: 'runtime/activate';
  payload?: OperationResponse;
  [k: string]: unknown;
};
export type RuntimeDeactivateRequest = ContractMessage & {
  kind?: 'request';
  method?: 'runtime/deactivate';
  payload?: {
    reason:
      | 'manual'
      | 'disable'
      | 'permission-revoked'
      | 'generation-replaced'
      | 'activation-rollback'
      | 'host-shutdown';
  };
  [k: string]: unknown;
};
export type RuntimeDeactivateResponse = ContractMessage & {
  kind?: 'response';
  method?: 'runtime/deactivate';
  payload?: OperationResponse;
  [k: string]: unknown;
};
export type RuntimeHeartbeatRequest = ContractMessage & {
  kind?: 'request';
  method?: 'runtime/heartbeat';
  payload?: {
    nonce: string;
  };
  [k: string]: unknown;
};
export type RuntimeHeartbeatResponse = ContractMessage & {
  kind?: 'response';
  method?: 'runtime/heartbeat';
  payload?: {
    nonce: string;
  };
  [k: string]: unknown;
};
export type RuntimeCancelEvent = ContractMessage & {
  kind?: 'event';
  method?: 'runtime/cancel';
  payload?: {
    requestId: string;
    reasonCode: string;
  };
  [k: string]: unknown;
};
export type RuntimeErrorEvent = ContractMessage & {
  kind?: 'event';
  method?: 'runtime/error';
  payload?: {
    reasonCode: string;
    safeMessage: string;
  };
  [k: string]: unknown;
};

export interface ContractMessage {
  kind: 'request' | 'response' | 'event';
  method: string;
  contractVersion: '1.0';
  payload: unknown;
}
export interface OperationResponse {
  ok: boolean;
  /**
   * @maxItems 32
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
