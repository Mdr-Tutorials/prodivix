import { describe, expect, it } from 'vitest';
import {
  createPirCodeSlotProvider,
  decodePirDocument,
  encodePirDocument,
  validatePirDocument,
  type PIRDocument,
} from '.';

const document = (): PIRDocument => ({
  logic: {
    dataById: {
      products: {
        operation: { documentId: 'catalog', operationId: 'list' },
        input: {
          kind: 'code',
          slotId: 'slot:query-input',
          reference: { artifactId: 'artifact:query-input' },
          input: { kind: 'runtime-value', valueId: 'symbol:filter' },
        },
        activations: [
          { kind: 'document' },
          { kind: 'input-change', dependencyId: 'symbol:filter' },
        ],
      },
    },
  },
  ui: {
    graph: {
      rootId: 'root',
      nodesById: {
        root: {
          id: 'root',
          kind: 'element',
          type: 'button',
          events: {
            onClick: {
              kind: 'dispatch-data-operation',
              operation: { documentId: 'catalog', operationId: 'remove' },
              input: {
                kind: 'code',
                slotId: 'slot:mutation-input',
                reference: { artifactId: 'artifact:mutation-input' },
                input: { kind: 'trigger-payload', path: '/id' },
              },
            },
          },
        },
      },
      childIdsById: { root: [] },
    },
  },
});

describe('PIR Data operation durable authoring contract', () => {
  it('round-trips typed query and mutation bindings through current wire', () => {
    const source = document();
    expect(validatePirDocument(source)).toEqual({ valid: true, issues: [] });
    const decoded = decodePirDocument(JSON.parse(encodePirDocument(source)));
    expect(decoded.ok).toBe(true);
    if (decoded.ok) expect(decoded.value).toEqual(source);
  });

  it('publishes every code-owned input transform through CodeSlot', () => {
    const provider = createPirCodeSlotProvider({
      workspaceId: 'workspace',
      documentId: 'page',
      document: document(),
    });
    expect(
      provider
        .listSlots({
          surface: 'inspector',
        })
        .map(({ id, kind }) => ({ id, kind }))
    ).toEqual(
      expect.arrayContaining([
        { id: 'slot:query-input', kind: 'data-input-transform' },
        { id: 'slot:mutation-input', kind: 'data-input-transform' },
      ])
    );
  });

  it('rejects query payload reads and unmapped input-change dependencies', () => {
    const source = document();
    const invalid: PIRDocument = {
      ...source,
      logic: {
        dataById: {
          products: {
            operation: { documentId: 'catalog', operationId: 'list' },
            input: { kind: 'trigger-payload' },
            activations: [
              { kind: 'input-change', dependencyId: 'symbol:missing' },
            ],
          },
        },
      },
    };
    const result = validatePirDocument(invalid);
    expect(result.valid).toBe(false);
    expect(result.issues.map(({ code }) => code)).toEqual(
      expect.arrayContaining([
        'PIR_DATA_OPERATION_BINDING',
        'PIR_DATA_OPERATION_BINDING',
      ])
    );
  });
});
