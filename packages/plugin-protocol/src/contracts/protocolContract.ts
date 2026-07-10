import type { JsonValue } from '@prodivix/plugin-contracts';
import type { ProtocolResult } from '#protocol/result';

export type ProtocolMessageKind = 'request' | 'response' | 'event';
export type ProtocolChannel = 'control' | 'gateway' | 'implementation';

export type ProtocolContractIdentity = Readonly<{
  channel: ProtocolChannel;
  method: string;
  contractVersion: string;
  kind: ProtocolMessageKind;
}>;

export type ProtocolPayloadContract<TPayload extends JsonValue = JsonValue> =
  ProtocolContractIdentity &
    Readonly<{
      validate(payload: JsonValue): ProtocolResult<TPayload>;
    }>;

export const protocolContractKey = (
  identity: ProtocolContractIdentity
): string =>
  `${identity.channel}\u0000${identity.method}\u0000${identity.contractVersion}\u0000${identity.kind}`;
