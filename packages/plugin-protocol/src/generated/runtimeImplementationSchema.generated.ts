/**
 * Generated from specs/plugins/runtime/runtime-implementation-v1.schema.json.
 * DO NOT EDIT. Run `pnpm --filter @prodivix/plugin-protocol generate`.
 */

export const RUNTIME_IMPLEMENTATION_V1_SCHEMA_ID =
  'https://prodivix.dev/schemas/runtime-implementation-v1.schema.json';
export const RUNTIME_IMPLEMENTATION_V1_SCHEMA_VERSION = '1.0';
export const RUNTIME_IMPLEMENTATION_V1_SCHEMA: object = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  $id: 'https://prodivix.dev/schemas/runtime-implementation-v1.schema.json',
  title: 'RuntimeImplementationMessageV1',
  description:
    'Implementation binding and invocation payload contracts for plugin runtimes.',
  'x-prodivix-contract-version': '1.0',
  oneOf: [
    { $ref: '#/$defs/bindEvent' },
    { $ref: '#/$defs/unbindEvent' },
    { $ref: '#/$defs/invokeRequest' },
    { $ref: '#/$defs/invokeResponse' },
  ],
  $defs: {
    contractMessage: {
      type: 'object',
      additionalProperties: false,
      required: ['kind', 'method', 'contractVersion', 'payload'],
      properties: {
        kind: { enum: ['request', 'response', 'event'] },
        method: { type: 'string' },
        contractVersion: { const: '1.0' },
        payload: true,
      },
    },
    localId: {
      type: 'string',
      minLength: 1,
      maxLength: 96,
      pattern: '^[a-z][A-Za-z0-9]*(?:[._-][A-Za-z0-9]+)*$',
    },
    methodBinding: {
      type: 'object',
      additionalProperties: false,
      required: ['method', 'contractVersion', 'required'],
      properties: {
        method: { $ref: '#/$defs/localId' },
        contractVersion: {
          type: 'string',
          pattern: '^(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)$',
        },
        required: { type: 'boolean' },
      },
    },
    bindEvent: {
      allOf: [
        { $ref: '#/$defs/contractMessage' },
        {
          properties: {
            kind: { const: 'event' },
            method: { const: 'implementation/bind' },
            payload: {
              type: 'object',
              additionalProperties: false,
              required: ['contributionId', 'implementationId', 'methods'],
              properties: {
                contributionId: { $ref: '#/$defs/localId' },
                implementationId: { $ref: '#/$defs/localId' },
                methods: {
                  type: 'array',
                  minItems: 1,
                  maxItems: 32,
                  items: { $ref: '#/$defs/methodBinding' },
                },
              },
            },
          },
        },
      ],
    },
    unbindEvent: {
      allOf: [
        { $ref: '#/$defs/contractMessage' },
        {
          properties: {
            kind: { const: 'event' },
            method: { const: 'implementation/unbind' },
            payload: {
              type: 'object',
              additionalProperties: false,
              required: ['contributionId', 'implementationId'],
              properties: {
                contributionId: { $ref: '#/$defs/localId' },
                implementationId: { $ref: '#/$defs/localId' },
              },
            },
          },
        },
      ],
    },
    invokeRequest: {
      allOf: [
        { $ref: '#/$defs/contractMessage' },
        {
          properties: {
            kind: { const: 'request' },
            method: { const: 'implementation/invoke' },
            payload: {
              type: 'object',
              additionalProperties: false,
              required: [
                'contributionId',
                'implementationId',
                'method',
                'arguments',
              ],
              properties: {
                contributionId: { $ref: '#/$defs/localId' },
                implementationId: { $ref: '#/$defs/localId' },
                method: { $ref: '#/$defs/localId' },
                arguments: {
                  $ref: 'runtime-envelope-v1.schema.json#/$defs/jsonValue',
                },
              },
            },
          },
        },
      ],
    },
    invokeResponse: {
      allOf: [
        { $ref: '#/$defs/contractMessage' },
        {
          properties: {
            kind: { const: 'response' },
            method: { const: 'implementation/invoke' },
            payload: {
              type: 'object',
              additionalProperties: false,
              required: ['ok'],
              properties: {
                ok: { type: 'boolean' },
                value: {
                  $ref: 'runtime-envelope-v1.schema.json#/$defs/jsonValue',
                },
                errorCode: { type: 'string', pattern: '^[A-Z]+-[0-9]{4}$' },
              },
            },
          },
        },
      ],
    },
  },
};
