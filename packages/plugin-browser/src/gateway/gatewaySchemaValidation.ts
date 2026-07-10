import {
  createPluginDiagnostic,
  PLUGIN_DIAGNOSTIC_CODES,
  type JsonValue,
  type PluginDiagnosticCode,
} from '@prodivix/plugin-contracts';
import {
  pluginHostFailure,
  pluginHostSuccess,
  type PluginHostResult,
} from '@prodivix/plugin-host';
import {
  encodeProtocolJsonText,
  GATEWAY_PROTOCOL_CONTRACTS,
  protocolContractKey,
  type ProtocolPayloadContract,
} from '@prodivix/plugin-protocol';

const gatewayValidators = new Map(
  GATEWAY_PROTOCOL_CONTRACTS.map((contract) => [
    protocolContractKey(contract),
    contract,
  ])
);

const requireValidator = (
  method: string,
  contractVersion: string,
  kind: 'request' | 'response'
): ProtocolPayloadContract | undefined =>
  gatewayValidators.get(
    protocolContractKey({
      channel: 'gateway',
      method,
      contractVersion,
      kind,
    })
  );

const validatePayload = (
  method: string,
  contractVersion: string,
  kind: 'request' | 'response',
  value: JsonValue
): PluginHostResult<JsonValue> => {
  const validator = requireValidator(method, contractVersion, kind);
  const validated = validator?.validate(value);
  if (validated?.ok) return pluginHostSuccess(validated.value);
  const code =
    kind === 'request'
      ? PLUGIN_DIAGNOSTIC_CODES.GATEWAY_REQUEST_INVALID
      : PLUGIN_DIAGNOSTIC_CODES.GATEWAY_RESPONSE_INVALID;
  return pluginHostFailure([
    createPluginDiagnostic(
      code,
      `Gateway ${kind} does not satisfy the exact method contract.`,
      {
        contractVersion,
        protocolMethod: method,
        protocolKind: kind,
      }
    ),
  ]);
};

export const validateGatewayRequest = (
  method: string,
  contractVersion: string,
  value: JsonValue
): PluginHostResult<JsonValue> =>
  validatePayload(method, contractVersion, 'request', value);

export const validateGatewayResponse = (
  method: string,
  contractVersion: string,
  value: JsonValue
): PluginHostResult<JsonValue> => {
  const validated = validatePayload(method, contractVersion, 'response', {
    ok: true,
    result: value,
  });
  return validated.ok
    ? pluginHostSuccess(value, validated.diagnostics)
    : validated;
};

export const measureGatewayJsonValue = (
  value: JsonValue,
  maxBytes: number,
  code: PluginDiagnosticCode,
  method: string,
  contractVersion: string
): PluginHostResult<number> => {
  const encoded = encodeProtocolJsonText(value, { maxBytes });
  if (encoded.ok) {
    return pluginHostSuccess(
      new TextEncoder().encode(encoded.value).byteLength
    );
  }
  return pluginHostFailure([
    createPluginDiagnostic(
      code,
      `Gateway payload exceeds the ${maxBytes} byte limit or is not strict JSON.`,
      {
        contractVersion,
        limit: maxBytes,
        protocolMethod: method,
      }
    ),
  ]);
};
