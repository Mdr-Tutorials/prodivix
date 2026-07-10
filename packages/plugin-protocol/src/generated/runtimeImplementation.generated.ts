/* eslint-disable */
/**
 * Generated from specs/plugins/runtime/runtime-implementation-v1.schema.json.
 * DO NOT EDIT. Run `pnpm --filter @prodivix/plugin-protocol generate`.
 */

/**
 * Implementation binding and invocation payload contracts for plugin runtimes.
 */
export type RuntimeImplementationMessageV1 =
  BindEvent | UnbindEvent | InvokeRequest | InvokeResponse;
export type BindEvent = ContractMessage & {
  kind?: 'event';
  method?: 'implementation/bind';
  payload?: {
    contributionId: LocalId;
    implementationId: LocalId;
    /**
     * @minItems 1
     * @maxItems 32
     */
    methods: MethodBinding[];
  };
  [k: string]: unknown;
};
export type LocalId = string;
export type UnbindEvent = ContractMessage & {
  kind?: 'event';
  method?: 'implementation/unbind';
  payload?: {
    contributionId: LocalId;
    implementationId: LocalId;
  };
  [k: string]: unknown;
};
export type InvokeRequest = ContractMessage & {
  kind?: 'request';
  method?: 'implementation/invoke';
  payload?: {
    contributionId: LocalId;
    implementationId: LocalId;
    method: LocalId;
    arguments: import('@prodivix/plugin-contracts').JsonValue;
  };
  [k: string]: unknown;
};
export type InvokeResponse = ContractMessage & {
  kind?: 'response';
  method?: 'implementation/invoke';
  payload?: {
    ok: boolean;
    value?: import('@prodivix/plugin-contracts').JsonValue;
    errorCode?: string;
  };
  [k: string]: unknown;
};

export interface ContractMessage {
  kind: 'request' | 'response' | 'event';
  method: string;
  contractVersion: '1.0';
  payload: unknown;
}
export interface MethodBinding {
  method: LocalId;
  contractVersion: string;
  required: boolean;
}
