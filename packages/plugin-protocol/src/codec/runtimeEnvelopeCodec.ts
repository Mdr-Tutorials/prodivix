import type { JsonValue } from '@prodivix/plugin-contracts';
import type { RuntimeEnvelopeV1 } from '#protocol/generated/runtimeEnvelope.generated';
import {
  decodeProtocolJsonText,
  encodeProtocolJsonText,
  type ProtocolJsonLimits,
} from '#protocol/codec/strictJsonCodec';
import { validateRuntimeEnvelope } from '#protocol/contracts/schemaContracts';
import type { ProtocolResult } from '#protocol/result';

export const decodeRuntimeEnvelopeV1 = (
  source: unknown,
  limits: Partial<ProtocolJsonLimits> = {}
): ProtocolResult<RuntimeEnvelopeV1> => {
  const decoded = decodeProtocolJsonText(source, limits);
  if (!decoded.ok) return decoded;
  return validateRuntimeEnvelope(decoded.value);
};

export const encodeRuntimeEnvelopeV1 = (
  envelope: RuntimeEnvelopeV1,
  limits: Partial<ProtocolJsonLimits> = {}
): ProtocolResult<string> => {
  const validated = validateRuntimeEnvelope(envelope as JsonValue);
  if (!validated.ok) return validated;
  return encodeProtocolJsonText(validated.value as JsonValue, limits);
};
