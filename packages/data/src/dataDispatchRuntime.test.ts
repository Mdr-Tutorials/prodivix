import { describe, expect, it } from 'vitest';
import {
  createDataOperationDispatchCoordinator,
  normalizeDataOperationInputBinding,
  type DataOperationDispatchRequest,
} from './dataDispatchRuntime';

const queryRequest = (
  overrides: Partial<DataOperationDispatchRequest> = {}
): DataOperationDispatchRequest => ({
  operation: { documentId: 'data-products', operationId: 'list' },
  documentRevision: '7',
  runtimeZone: 'client',
  mode: 'live',
  trigger: { kind: 'input-change', dependencyId: 'filters' },
  input: {
    kind: 'object',
    propertiesByKey: {
      tenant: { kind: 'runtime-value', valueId: 'tenant', path: '/id' },
      search: { kind: 'trigger-payload', path: '/query' },
      page: { kind: 'literal', value: 1 },
    },
  },
  inputContext: {
    triggerPayload: { query: 'chair' },
    runtimeValuesById: { tenant: { id: 'tenant-1' } },
  },
  ...overrides,
});

describe('Data operation dispatch coordinator', () => {
  it('normalizes the durable input tree and rejects non-canonical pointers', () => {
    const source = {
      kind: 'object' as const,
      propertiesByKey: {
        z: { kind: 'literal' as const, value: { page: 1 } },
        a: {
          kind: 'code' as const,
          slotId: 'slot:map-input',
          reference: { artifactId: 'artifact:map-input' },
          input: {
            kind: 'trigger-payload' as const,
            path: '/item~1id',
          },
        },
      },
    };
    const normalized = normalizeDataOperationInputBinding(source);

    expect(normalized.kind).toBe('object');
    if (normalized.kind !== 'object') return;
    expect(Object.keys(normalized.propertiesByKey)).toEqual(['a', 'z']);
    expect(normalized).not.toBe(source);
    expect(Object.isFrozen(normalized)).toBe(true);
    expect(() =>
      normalizeDataOperationInputBinding({
        kind: 'runtime-value',
        valueId: 'filter',
        path: 'filter/value',
      })
    ).toThrowError(
      expect.objectContaining({ code: 'DATA_DISPATCH_INPUT_BINDING_INVALID' })
    );
  });

  it('maps typed query input and skips unchanged dependency activations', async () => {
    const invocations: unknown[] = [];
    const coordinator = createDataOperationDispatchCoordinator({
      resolveOperationKind: () => 'query' as const,
      execute(invocation) {
        invocations.push(invocation);
        return invocation.input;
      },
      now: () => 125,
      createInvocationId: ({ sequence }) => `query-${sequence}`,
    });

    const first = await coordinator.dispatch(queryRequest(), undefined);
    const duplicate = await coordinator.dispatch(queryRequest(), undefined);
    const changed = await coordinator.dispatch(
      queryRequest({
        inputContext: {
          triggerPayload: { query: 'table' },
          runtimeValuesById: { tenant: { id: 'tenant-1' } },
        },
      }),
      undefined
    );

    expect(first).toMatchObject({
      status: 'dispatched',
      invocation: {
        invocationId: 'query-1',
        sequence: 1,
        startedAt: 125,
        activation: 'input-change',
        trigger: { kind: 'input-change', dependencyId: 'filters' },
        input: { page: 1, search: 'chair', tenant: 'tenant-1' },
      },
    });
    expect(duplicate).toEqual({ status: 'skipped-unchanged' });
    expect(changed).toMatchObject({
      status: 'dispatched',
      invocation: { invocationId: 'query-2', sequence: 2 },
    });
    expect(invocations).toHaveLength(2);
  });

  it('dispatches an explicit mutation once and never replays its identity', async () => {
    let calls = 0;
    const coordinator = createDataOperationDispatchCoordinator({
      resolveOperationKind: () => 'mutation' as const,
      execute(invocation) {
        calls += 1;
        return invocation.input;
      },
      now: () => 10,
    });
    const request: DataOperationDispatchRequest = {
      operation: { documentId: 'data-products', operationId: 'create' },
      documentRevision: '7',
      runtimeZone: 'client',
      mode: 'live',
      trigger: {
        kind: 'blueprint-event',
        documentId: 'page-products',
        nodeId: 'button-create',
        eventName: 'click',
        dispatchId: 'event-1',
      },
      input: { kind: 'trigger-payload', path: '/form' },
      inputContext: {
        triggerPayload: { form: { name: 'Chair' } },
      },
    };

    await expect(
      coordinator.dispatch(request, undefined)
    ).resolves.toMatchObject({
      status: 'dispatched',
      invocation: {
        activation: 'event',
        sequence: 1,
        input: { name: 'Chair' },
      },
    });
    await expect(coordinator.dispatch(request, undefined)).resolves.toEqual({
      status: 'skipped-duplicate',
    });
    expect(calls).toBe(1);
  });

  it('routes code-owned input transforms through an injected CodeSlot resolver', async () => {
    const coordinator = createDataOperationDispatchCoordinator({
      resolveOperationKind: () => 'mutation' as const,
      execute: (invocation) => invocation.input,
      codeInputResolver: {
        resolve: ({ slotId, value }) => ({ slotId, value }),
      },
    });

    const result = await coordinator.dispatch(
      {
        operation: { documentId: 'data-products', operationId: 'update' },
        documentRevision: '7',
        runtimeZone: 'client',
        mode: 'live',
        trigger: {
          kind: 'code-slot',
          slotId: 'data-dispatch:save',
          reference: { artifactId: 'artifact-save', exportName: 'dispatch' },
          dispatchId: 'code-dispatch-1',
        },
        input: {
          kind: 'code',
          slotId: 'data-input:normalize',
          reference: { artifactId: 'artifact-normalize', exportName: 'run' },
          input: { kind: 'literal', value: { id: 'product-1' } },
        },
      },
      undefined
    );

    expect(result).toMatchObject({
      status: 'dispatched',
      invocation: {
        activation: 'code-slot',
        input: {
          slotId: 'data-input:normalize',
          value: { id: 'product-1' },
        },
      },
    });
  });

  it('fails before execute on incompatible triggers or missing input values', async () => {
    let calls = 0;
    const coordinator = createDataOperationDispatchCoordinator({
      resolveOperationKind: () => 'mutation' as const,
      execute() {
        calls += 1;
      },
    });

    await expect(
      coordinator.dispatch(queryRequest(), undefined)
    ).rejects.toMatchObject({ code: 'DATA_DISPATCH_TRIGGER_INCOMPATIBLE' });
    await expect(
      coordinator.dispatch(
        {
          operation: { documentId: 'data-products', operationId: 'create' },
          documentRevision: '7',
          runtimeZone: 'client',
          mode: 'live',
          trigger: {
            kind: 'test',
            testId: 'crud',
            dispatchId: 'test-1',
          },
          input: { kind: 'runtime-value', valueId: 'missing' },
        },
        undefined
      )
    ).rejects.toMatchObject({ code: 'DATA_DISPATCH_INPUT_VALUE_MISSING' });
    await expect(
      coordinator.dispatch(
        {
          operation: { documentId: 'data-products', operationId: 'create' },
          documentRevision: '7',
          runtimeZone: 'client',
          mode: 'live',
          trigger: {
            kind: 'test',
            testId: 'crud',
            dispatchId: 'test-1',
          },
          input: { kind: 'literal', value: { name: 'Recovered' } },
        },
        undefined
      )
    ).resolves.toMatchObject({ status: 'dispatched' });
    expect(calls).toBe(1);
  });

  it('consumes a mutation dispatch identity once execution starts, even if the effect fails', async () => {
    const coordinator = createDataOperationDispatchCoordinator({
      resolveOperationKind: () => 'mutation' as const,
      execute() {
        throw new Error('connection lost after dispatch');
      },
    });
    const request: DataOperationDispatchRequest = {
      operation: { documentId: 'data-products', operationId: 'delete' },
      documentRevision: '7',
      runtimeZone: 'client',
      mode: 'live',
      trigger: {
        kind: 'blueprint-event',
        documentId: 'page-products',
        nodeId: 'delete-button',
        eventName: 'click',
        dispatchId: 'delete-1',
      },
      input: { kind: 'literal', value: { id: 'product-1' } },
    };

    await expect(coordinator.dispatch(request, undefined)).rejects.toThrow(
      /connection lost/u
    );
    await expect(coordinator.dispatch(request, undefined)).resolves.toEqual({
      status: 'skipped-duplicate',
    });
  });

  it('allows fixture-controlled test triggers for both query and mutation operations', async () => {
    const coordinator = createDataOperationDispatchCoordinator({
      resolveOperationKind: (request) =>
        request.operation.operationId === 'list' ? 'query' : 'mutation',
      execute: (invocation) => invocation.operation.operationId,
    });
    const dispatch = (operationId: string, dispatchId: string) =>
      coordinator.dispatch(
        {
          operation: { documentId: 'data-products', operationId },
          documentRevision: '7',
          runtimeZone: 'test' as const,
          mode: 'mock' as const,
          trigger: { kind: 'test' as const, testId: 'crud', dispatchId },
          input: { kind: 'literal' as const, value: {} },
        },
        undefined
      );

    await expect(dispatch('list', 'query-1')).resolves.toMatchObject({
      status: 'dispatched',
      invocation: { activation: 'test' },
    });
    await expect(dispatch('create', 'mutation-1')).resolves.toMatchObject({
      status: 'dispatched',
      invocation: { activation: 'test' },
    });
  });
});
