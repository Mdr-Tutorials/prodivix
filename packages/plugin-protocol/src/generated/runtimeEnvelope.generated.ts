/* eslint-disable */
/**
 * Generated from specs/plugins/runtime/runtime-envelope-v1.schema.json.
 * DO NOT EDIT. Run `pnpm --filter @prodivix/plugin-protocol generate`.
 */

/**
 * Strict JSON transport envelope shared by the Prodivix plugin Host and runtime.
 */
export type RuntimeEnvelopeV1 = {
  [k: string]: unknown;
} & {
  protocol: 'prodivix.plugin-runtime';
  protocolVersion: '1.0';
  kind: 'request' | 'response' | 'event';
  channel: 'control' | 'gateway' | 'implementation';
  method: Method;
  contractVersion: ContractVersion;
  messageId: MessageId;
  replyTo?: MessageId;
  sequence: number;
  payload: JsonValue;
};
export type Method = string;
export type ContractVersion = string;
export type MessageId = string;
export type JsonValue = import('@prodivix/plugin-contracts').JsonValue;
