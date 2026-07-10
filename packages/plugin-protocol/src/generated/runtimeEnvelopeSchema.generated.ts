/**
 * Generated from specs/plugins/runtime/runtime-envelope-v1.schema.json.
 * DO NOT EDIT. Run `pnpm --filter @prodivix/plugin-protocol generate`.
 */

export const RUNTIME_ENVELOPE_V1_SCHEMA_ID =
  'https://prodivix.dev/schemas/runtime-envelope-v1.schema.json';
export const RUNTIME_ENVELOPE_V1_SCHEMA_VERSION = '1.0';
export const RUNTIME_ENVELOPE_V1_SCHEMA: object = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  $id: 'https://prodivix.dev/schemas/runtime-envelope-v1.schema.json',
  title: 'RuntimeEnvelopeV1',
  description:
    'Strict JSON transport envelope shared by the Prodivix plugin Host and runtime.',
  'x-prodivix-contract-version': '1.0',
  type: 'object',
  additionalProperties: false,
  required: [
    'protocol',
    'protocolVersion',
    'kind',
    'channel',
    'method',
    'contractVersion',
    'messageId',
    'sequence',
    'payload',
  ],
  properties: {
    protocol: { const: 'prodivix.plugin-runtime' },
    protocolVersion: { const: '1.0' },
    kind: { enum: ['request', 'response', 'event'] },
    channel: { enum: ['control', 'gateway', 'implementation'] },
    method: { $ref: '#/$defs/method' },
    contractVersion: { $ref: '#/$defs/contractVersion' },
    messageId: { $ref: '#/$defs/messageId' },
    replyTo: { $ref: '#/$defs/messageId' },
    sequence: { type: 'integer', minimum: 1, maximum: 9007199254740991 },
    payload: { $ref: '#/$defs/jsonValue' },
  },
  allOf: [
    {
      if: { properties: { kind: { const: 'response' } }, required: ['kind'] },
      then: {
        properties: { replyTo: { $ref: '#/$defs/messageId' } },
        required: ['replyTo'],
      },
      else: { not: { properties: { replyTo: true }, required: ['replyTo'] } },
    },
  ],
  $defs: {
    method: {
      type: 'string',
      minLength: 3,
      maxLength: 96,
      pattern: '^[a-z][a-z0-9-]*(?:\\.[a-z][a-z0-9-]*)*(?:/[a-z][a-z0-9-]*)+$',
    },
    contractVersion: {
      type: 'string',
      pattern: '^(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)$',
      maxLength: 24,
    },
    messageId: {
      type: 'string',
      minLength: 3,
      maxLength: 128,
      pattern: '^[A-Za-z0-9][A-Za-z0-9._:-]*$',
    },
    jsonValue: {
      oneOf: [
        { type: 'null' },
        { type: 'boolean' },
        { type: 'number' },
        { type: 'string' },
        { type: 'array', items: { $ref: '#/$defs/jsonValue' } },
        { type: 'object', additionalProperties: { $ref: '#/$defs/jsonValue' } },
      ],
    },
  },
};
