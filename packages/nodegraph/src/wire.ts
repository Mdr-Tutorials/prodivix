const canonicalStringSchema = {
  type: 'string',
  minLength: 1,
  pattern: '^\\S(?:[\\s\\S]*\\S)?$',
} as const;

/**
 * Machine-readable persistence contract for the version-neutral NodeGraph
 * domain model. Numeric versions remain confined to this wire boundary.
 */
export const nodeGraphCurrentWireSchema = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  $id: 'https://prodivix.dev/schemas/nodegraph/current.json',
  title: 'Prodivix NodeGraph current wire document',
  type: 'object',
  required: ['version', 'nodes', 'edges'],
  properties: {
    version: { const: 1 },
    nodes: {
      type: 'array',
      items: { $ref: '#/$defs/node' },
    },
    edges: {
      type: 'array',
      items: { $ref: '#/$defs/edge' },
    },
  },
  additionalProperties: false,
  $defs: {
    canonicalString: canonicalStringSchema,
    sourceSpan: {
      type: 'object',
      required: [
        'artifactId',
        'startLine',
        'startColumn',
        'endLine',
        'endColumn',
      ],
      properties: {
        artifactId: { $ref: '#/$defs/canonicalString' },
        startLine: { type: 'integer', minimum: 1 },
        startColumn: { type: 'integer', minimum: 1 },
        endLine: { type: 'integer', minimum: 1 },
        endColumn: { type: 'integer', minimum: 1 },
      },
      additionalProperties: false,
    },
    codeReference: {
      type: 'object',
      required: ['artifactId'],
      properties: {
        artifactId: { $ref: '#/$defs/canonicalString' },
        exportName: { $ref: '#/$defs/canonicalString' },
        symbolId: { $ref: '#/$defs/canonicalString' },
        sourceSpan: { $ref: '#/$defs/sourceSpan' },
      },
      additionalProperties: false,
    },
    codeSlotBinding: {
      type: 'object',
      required: ['slotId', 'reference'],
      properties: {
        slotId: { $ref: '#/$defs/canonicalString' },
        reference: { $ref: '#/$defs/codeReference' },
      },
      additionalProperties: false,
    },
    port: {
      type: 'object',
      required: ['id', 'direction', 'kind'],
      properties: {
        id: { $ref: '#/$defs/canonicalString' },
        direction: { enum: ['input', 'output'] },
        kind: { enum: ['control', 'data'] },
        typeRef: { $ref: '#/$defs/canonicalString' },
        required: { type: 'boolean' },
        multiple: { type: 'boolean' },
      },
      additionalProperties: false,
    },
    node: {
      type: 'object',
      required: ['id', 'data'],
      properties: {
        id: { $ref: '#/$defs/canonicalString' },
        type: { $ref: '#/$defs/canonicalString' },
        data: { type: 'object', additionalProperties: true },
        ports: {
          type: 'array',
          items: { $ref: '#/$defs/port' },
        },
        executor: { $ref: '#/$defs/codeSlotBinding' },
      },
      additionalProperties: false,
    },
    edge: {
      type: 'object',
      required: ['id', 'source', 'target'],
      properties: {
        id: { $ref: '#/$defs/canonicalString' },
        source: { $ref: '#/$defs/canonicalString' },
        target: { $ref: '#/$defs/canonicalString' },
        sourceHandle: { type: ['string', 'null'] },
        targetHandle: { type: ['string', 'null'] },
      },
      additionalProperties: false,
    },
  },
  examples: [
    {
      version: 1,
      nodes: [
        {
          id: 'source',
          type: 'graphNode',
          data: { kind: 'code' },
          ports: [
            {
              id: 'out.control.next',
              direction: 'output',
              kind: 'control',
            },
          ],
          executor: {
            slotId: 'nodegraph-code-slot:source',
            reference: {
              artifactId: 'artifact-source',
              exportName: 'run',
              sourceSpan: {
                artifactId: 'artifact-source',
                startLine: 1,
                startColumn: 1,
                endLine: 1,
                endColumn: 4,
              },
            },
          },
        },
        {
          id: 'target',
          data: { kind: 'process' },
          ports: [
            {
              id: 'in.control.prev',
              direction: 'input',
              kind: 'control',
            },
          ],
        },
      ],
      edges: [
        {
          id: 'edge',
          source: 'source',
          target: 'target',
          sourceHandle: 'out.control.next',
          targetHandle: 'in.control.prev',
        },
      ],
    },
  ],
} as const;

export const nodeGraphCurrentWireFields = Object.freeze({
  document: Object.freeze(Object.keys(nodeGraphCurrentWireSchema.properties)),
  node: Object.freeze(
    Object.keys(nodeGraphCurrentWireSchema.$defs.node.properties)
  ),
  port: Object.freeze(
    Object.keys(nodeGraphCurrentWireSchema.$defs.port.properties)
  ),
  codeSlotBinding: Object.freeze(
    Object.keys(nodeGraphCurrentWireSchema.$defs.codeSlotBinding.properties)
  ),
  codeReference: Object.freeze(
    Object.keys(nodeGraphCurrentWireSchema.$defs.codeReference.properties)
  ),
  sourceSpan: Object.freeze(
    Object.keys(nodeGraphCurrentWireSchema.$defs.sourceSpan.properties)
  ),
  edge: Object.freeze(
    Object.keys(nodeGraphCurrentWireSchema.$defs.edge.properties)
  ),
});
