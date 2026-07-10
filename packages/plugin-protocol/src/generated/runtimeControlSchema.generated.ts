/**
 * Generated from specs/plugins/runtime/runtime-control-v1.schema.json.
 * DO NOT EDIT. Run `pnpm --filter @prodivix/plugin-protocol generate`.
 */

export const RUNTIME_CONTROL_V1_SCHEMA_ID =
  'https://prodivix.dev/schemas/runtime-control-v1.schema.json';
export const RUNTIME_CONTROL_V1_SCHEMA_VERSION = '1.0';
export const RUNTIME_CONTROL_V1_SCHEMA: object = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  $id: 'https://prodivix.dev/schemas/runtime-control-v1.schema.json',
  title: 'RuntimeControlMessageV1',
  description:
    'Control-channel payload contracts for Prodivix plugin runtime lifecycle.',
  'x-prodivix-contract-version': '1.0',
  oneOf: [
    { $ref: '#/$defs/runtimeReadyEvent' },
    { $ref: '#/$defs/runtimeActivateRequest' },
    { $ref: '#/$defs/runtimeActivateResponse' },
    { $ref: '#/$defs/runtimeDeactivateRequest' },
    { $ref: '#/$defs/runtimeDeactivateResponse' },
    { $ref: '#/$defs/runtimeHeartbeatRequest' },
    { $ref: '#/$defs/runtimeHeartbeatResponse' },
    { $ref: '#/$defs/runtimeCancelEvent' },
    { $ref: '#/$defs/runtimeErrorEvent' },
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
    safeDiagnostic: {
      type: 'object',
      additionalProperties: false,
      required: ['code', 'message'],
      properties: {
        code: { type: 'string', pattern: '^[A-Z]+-[0-9]{4}$' },
        message: { type: 'string', minLength: 1, maxLength: 512 },
        meta: {
          type: 'object',
          maxProperties: 16,
          additionalProperties: {
            type: ['null', 'boolean', 'number', 'string'],
          },
        },
      },
    },
    operationResponse: {
      type: 'object',
      additionalProperties: false,
      required: ['ok', 'diagnostics'],
      properties: {
        ok: { type: 'boolean' },
        diagnostics: {
          type: 'array',
          maxItems: 32,
          items: { $ref: '#/$defs/safeDiagnostic' },
        },
      },
    },
    runtimeReadyEvent: {
      allOf: [
        { $ref: '#/$defs/contractMessage' },
        {
          properties: {
            kind: { const: 'event' },
            method: { const: 'runtime/ready' },
            payload: {
              type: 'object',
              additionalProperties: false,
              required: ['selectedProtocolVersion', 'runtimeDigest'],
              properties: {
                selectedProtocolVersion: { const: '1.0' },
                runtimeDigest: {
                  type: 'string',
                  pattern: '^sha256-[A-Za-z0-9+/]{43}=$',
                },
                runtimeModuleVersion: {
                  type: 'string',
                  minLength: 1,
                  maxLength: 64,
                },
              },
            },
          },
        },
      ],
    },
    runtimeActivateRequest: {
      allOf: [
        { $ref: '#/$defs/contractMessage' },
        {
          properties: {
            kind: { const: 'request' },
            method: { const: 'runtime/activate' },
            payload: {
              type: 'object',
              additionalProperties: false,
              required: ['event'],
              properties: {
                event: {
                  $ref: 'runtime-envelope-v1.schema.json#/$defs/jsonValue',
                },
              },
            },
          },
        },
      ],
    },
    runtimeActivateResponse: {
      allOf: [
        { $ref: '#/$defs/contractMessage' },
        {
          properties: {
            kind: { const: 'response' },
            method: { const: 'runtime/activate' },
            payload: { $ref: '#/$defs/operationResponse' },
          },
        },
      ],
    },
    runtimeDeactivateRequest: {
      allOf: [
        { $ref: '#/$defs/contractMessage' },
        {
          properties: {
            kind: { const: 'request' },
            method: { const: 'runtime/deactivate' },
            payload: {
              type: 'object',
              additionalProperties: false,
              required: ['reason'],
              properties: {
                reason: {
                  enum: [
                    'manual',
                    'disable',
                    'permission-revoked',
                    'generation-replaced',
                    'activation-rollback',
                    'host-shutdown',
                  ],
                },
              },
            },
          },
        },
      ],
    },
    runtimeDeactivateResponse: {
      allOf: [
        { $ref: '#/$defs/contractMessage' },
        {
          properties: {
            kind: { const: 'response' },
            method: { const: 'runtime/deactivate' },
            payload: { $ref: '#/$defs/operationResponse' },
          },
        },
      ],
    },
    runtimeHeartbeatRequest: {
      allOf: [
        { $ref: '#/$defs/contractMessage' },
        {
          properties: {
            kind: { const: 'request' },
            method: { const: 'runtime/heartbeat' },
            payload: {
              type: 'object',
              additionalProperties: false,
              required: ['nonce'],
              properties: {
                nonce: { type: 'string', minLength: 1, maxLength: 128 },
              },
            },
          },
        },
      ],
    },
    runtimeHeartbeatResponse: {
      allOf: [
        { $ref: '#/$defs/contractMessage' },
        {
          properties: {
            kind: { const: 'response' },
            method: { const: 'runtime/heartbeat' },
            payload: {
              type: 'object',
              additionalProperties: false,
              required: ['nonce'],
              properties: {
                nonce: { type: 'string', minLength: 1, maxLength: 128 },
              },
            },
          },
        },
      ],
    },
    runtimeCancelEvent: {
      allOf: [
        { $ref: '#/$defs/contractMessage' },
        {
          properties: {
            kind: { const: 'event' },
            method: { const: 'runtime/cancel' },
            payload: {
              type: 'object',
              additionalProperties: false,
              required: ['requestId', 'reasonCode'],
              properties: {
                requestId: { type: 'string', minLength: 3, maxLength: 128 },
                reasonCode: { type: 'string', minLength: 1, maxLength: 96 },
              },
            },
          },
        },
      ],
    },
    runtimeErrorEvent: {
      allOf: [
        { $ref: '#/$defs/contractMessage' },
        {
          properties: {
            kind: { const: 'event' },
            method: { const: 'runtime/error' },
            payload: {
              type: 'object',
              additionalProperties: false,
              required: ['reasonCode', 'safeMessage'],
              properties: {
                reasonCode: { type: 'string', minLength: 1, maxLength: 96 },
                safeMessage: { type: 'string', minLength: 1, maxLength: 512 },
              },
            },
          },
        },
      ],
    },
  },
};
