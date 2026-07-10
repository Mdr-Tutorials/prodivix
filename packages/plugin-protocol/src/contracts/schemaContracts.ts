import {
  createPluginDiagnostic,
  PLUGIN_DIAGNOSTIC_CODES,
  type JsonValue,
} from '@prodivix/plugin-contracts';
import type { ErrorObject, ValidateFunction } from 'ajv';
import type { RuntimeEnvelopeV1 } from '#protocol/generated/runtimeEnvelope.generated';
import {
  validateGatewayEnvelopeSchema,
  validateRuntimeControlSchema,
  validateRuntimeEnvelopeSchema,
  validateRuntimeImplementationSchema,
} from '#protocol/generated/schemaValidators.generated';
import type {
  ProtocolContractIdentity,
  ProtocolPayloadContract,
} from '#protocol/contracts/protocolContract';
import {
  protocolFailure,
  protocolSuccess,
  type ProtocolResult,
} from '#protocol/result';

const envelopeValidator =
  validateRuntimeEnvelopeSchema as ValidateFunction<RuntimeEnvelopeV1>;

type ContractSchemaFamily = 'control' | 'implementation' | 'gateway';

const familyValidators = Object.freeze({
  control: validateRuntimeControlSchema as ValidateFunction,
  implementation: validateRuntimeImplementationSchema as ValidateFunction,
  gateway: validateGatewayEnvelopeSchema as ValidateFunction,
}) satisfies Record<ContractSchemaFamily, ValidateFunction>;

const firstErrorMeta = (error: ErrorObject | null | undefined) => ({
  documentPath: error?.instancePath ?? '',
  schemaPath: error?.schemaPath,
  schemaKeyword: error?.keyword,
});

export const validateRuntimeEnvelope = (
  value: JsonValue
): ProtocolResult<RuntimeEnvelopeV1> => {
  if (envelopeValidator(value)) {
    return protocolSuccess(value as RuntimeEnvelopeV1);
  }
  return protocolFailure([
    createPluginDiagnostic(
      PLUGIN_DIAGNOSTIC_CODES.MALFORMED_PROTOCOL_MESSAGE,
      'Protocol message does not satisfy Runtime Envelope v1.',
      firstErrorMeta(envelopeValidator.errors?.[0])
    ),
  ]);
};

const createSchemaPayloadContract = (
  family: ContractSchemaFamily,
  identity: ProtocolContractIdentity
): ProtocolPayloadContract => {
  const validator = familyValidators[family];
  return Object.freeze({
    ...identity,
    validate: (payload: JsonValue) => {
      const contractMessage = {
        kind: identity.kind,
        method: identity.method,
        contractVersion: identity.contractVersion,
        payload,
      };
      if (validator(contractMessage)) return protocolSuccess(payload);
      return protocolFailure([
        createPluginDiagnostic(
          PLUGIN_DIAGNOSTIC_CODES.MALFORMED_PROTOCOL_MESSAGE,
          `Payload does not satisfy ${JSON.stringify(identity.method)} contract ${JSON.stringify(identity.contractVersion)} for ${identity.kind}.`,
          {
            ...firstErrorMeta(validator.errors?.[0]),
            contractVersion: identity.contractVersion,
            protocolChannel: identity.channel,
            protocolMethod: identity.method,
            protocolKind: identity.kind,
          }
        ),
      ]);
    },
  });
};

const identities = (
  family: ContractSchemaFamily,
  channel: ProtocolContractIdentity['channel'],
  entries: ReadonlyArray<
    readonly [
      method: string,
      kinds: readonly ProtocolContractIdentity['kind'][],
    ]
  >
): readonly ProtocolPayloadContract[] =>
  Object.freeze(
    entries.flatMap(([method, kinds]) =>
      kinds.map((kind) =>
        createSchemaPayloadContract(family, {
          channel,
          method,
          contractVersion: '1.0',
          kind,
        })
      )
    )
  );

export const RUNTIME_CONTROL_PROTOCOL_CONTRACTS = identities(
  'control',
  'control',
  [
    ['runtime/ready', ['event']],
    ['runtime/activate', ['request', 'response']],
    ['runtime/deactivate', ['request', 'response']],
    ['runtime/heartbeat', ['request', 'response']],
    ['runtime/cancel', ['event']],
    ['runtime/error', ['event']],
  ]
);

export const RUNTIME_IMPLEMENTATION_PROTOCOL_CONTRACTS = identities(
  'implementation',
  'implementation',
  [
    ['implementation/bind', ['event']],
    ['implementation/unbind', ['event']],
    ['implementation/invoke', ['request', 'response']],
  ]
);

export const GATEWAY_PROTOCOL_CONTRACTS = identities('gateway', 'gateway', [
  ['runtime.health/ping', ['request', 'response']],
  ['telemetry/emit', ['request', 'response']],
  ['workspace/read-summary', ['request', 'response']],
  ['workspace/dispatch-intent', ['request', 'response']],
  ['document/read', ['request', 'response']],
  ['document/apply-patch', ['request', 'response']],
  ['network/request', ['request', 'response']],
]);

export const BUILT_IN_PROTOCOL_CONTRACTS = Object.freeze([
  ...RUNTIME_CONTROL_PROTOCOL_CONTRACTS,
  ...RUNTIME_IMPLEMENTATION_PROTOCOL_CONTRACTS,
  ...GATEWAY_PROTOCOL_CONTRACTS,
]);
