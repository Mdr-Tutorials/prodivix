import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { DataJsonValue, DataLifecycleSnapshot } from '@prodivix/data';
import {
  appendPirProjectionComponentPath,
  createPirProjectionRootPath,
  type PIRCollectionPreviewInput,
  type PIRJsonValue,
} from '@prodivix/pir';
import { PIRRenderer } from '../PIRRenderer';
import type { PIRDataOperationRuntimePort } from '../PIRRenderer.types';
import {
  createContract,
  createProjectionPlan,
  createWorkspaceDocument,
  nativeHost,
} from '../__tests__/pirRendererFixtures';

const createCounterDefinition = () =>
  createWorkspaceDocument({
    id: 'counter',
    type: 'pir-component',
    rootId: 'action',
    contract: createContract({
      propsById: {
        label: { id: 'label', name: 'Label', typeRef: 'string' },
      },
    }),
    logic: {
      state: { count: { typeRef: 'number', initial: 0 } },
    },
    nodesById: {
      action: {
        id: 'action',
        kind: 'element',
        type: 'button',
        text: { kind: 'state', stateId: 'count' },
        props: {
          'aria-label': { kind: 'component-prop', memberId: 'label' },
        },
        events: {
          click: {
            kind: 'call-code',
            slotId: 'increment',
            reference: { artifactId: 'increment-code' },
          },
        },
      },
    },
  });

const createNestedCollectionPage = (
  groups: readonly Readonly<{
    id: string;
    label: string;
    children: readonly Readonly<{ id: string; name: string }>[];
  }>[]
) =>
  createWorkspaceDocument({
    id: 'page',
    type: 'pir-page',
    rootId: 'root',
    nodesById: {
      root: { id: 'root', kind: 'element', type: 'main' },
      groups: {
        id: 'groups',
        kind: 'collection',
        source: { kind: 'literal', value: groups },
        key: {
          kind: 'binding',
          value: {
            kind: 'collection-symbol',
            symbolId: 'group-item',
            path: 'id',
          },
        },
        symbols: {
          itemId: 'group-item',
          itemName: 'group',
          indexId: 'group-index',
          indexName: 'groupIndex',
        },
      },
      groupLabel: {
        id: 'groupLabel',
        kind: 'element',
        type: 'h2',
        text: {
          kind: 'collection-symbol',
          symbolId: 'group-item',
          path: 'label',
        },
      },
      children: {
        id: 'children',
        kind: 'collection',
        source: {
          kind: 'binding',
          value: {
            kind: 'collection-symbol',
            symbolId: 'group-item',
            path: 'children',
          },
        },
        key: {
          kind: 'binding',
          value: {
            kind: 'collection-symbol',
            symbolId: 'child-item',
            path: 'id',
          },
        },
        symbols: {
          itemId: 'child-item',
          itemName: 'child',
          indexId: 'child-index',
          indexName: 'childIndex',
        },
      },
      parentLabel: {
        id: 'parentLabel',
        kind: 'element',
        type: 'span',
        text: {
          kind: 'collection-symbol',
          symbolId: 'group-item',
          path: 'label',
        },
      },
      counter: {
        id: 'counter',
        kind: 'component-instance',
        componentDocumentId: 'counter',
        bindings: {
          props: {
            label: {
              kind: 'collection-symbol',
              symbolId: 'child-item',
              path: 'name',
            },
          },
          events: {},
          variants: {},
        },
      },
    },
    childIdsById: { root: ['groups'] },
    regionsById: {
      groups: { item: ['groupLabel', 'children'] },
      children: { item: ['parentLabel', 'counter'] },
    },
  });

const DATA_OPERATION = Object.freeze({
  documentId: 'catalog-data',
  operationId: 'list-products',
});

const createLifecycleCollectionDocument = (
  id: string,
  type: 'pir-page' | 'pir-component' = 'pir-page'
) =>
  createWorkspaceDocument({
    id,
    type,
    rootId: 'collection',
    ...(type === 'pir-component' ? { contract: createContract() } : {}),
    logic: { dataById: { products: { operation: DATA_OPERATION } } },
    nodesById: {
      collection: {
        id: 'collection',
        kind: 'collection',
        source: {
          kind: 'binding',
          value: { kind: 'data', dataId: 'products' },
        },
        key: {
          kind: 'binding',
          value: {
            kind: 'collection-symbol',
            symbolId: 'product',
            path: 'id',
          },
        },
        lifecycle: {
          kind: 'data-operation',
          dataId: 'products',
          idle: 'loading',
        },
        symbols: {
          itemId: 'product',
          itemName: 'product',
          indexId: 'product-index',
          indexName: 'productIndex',
          errorId: 'products-error',
        },
      },
      item: {
        id: 'item',
        kind: 'element',
        type: 'p',
        text: {
          kind: 'collection-symbol',
          symbolId: 'product',
          path: 'name',
        },
      },
      loading: {
        id: 'loading',
        kind: 'element',
        type: 'p',
        text: { kind: 'literal', value: 'lifecycle-loading' },
      },
      empty: {
        id: 'empty',
        kind: 'element',
        type: 'p',
        text: { kind: 'literal', value: 'lifecycle-empty' },
      },
      error: {
        id: 'error',
        kind: 'element',
        type: 'p',
        text: {
          kind: 'collection-symbol',
          symbolId: 'products-error',
          path: 'message',
        },
      },
    },
    regionsById: {
      collection: {
        item: ['item'],
        loading: ['loading'],
        empty: ['empty'],
        error: ['error'],
      },
    },
  });

const lifecycleSnapshot = (
  status: DataLifecycleSnapshot['status'],
  value?: DataJsonValue
): DataLifecycleSnapshot => {
  const base = { operation: DATA_OPERATION, sequence: 1 } as const;
  if (status === 'idle') return { ...base, status };
  const active = {
    ...base,
    invocationId: 'invocation-1',
    attempt: 1,
    startedAt: 1,
  } as const;
  if (status === 'loading') return { ...active, status: 'loading' };
  if (status === 'success') {
    return {
      ...active,
      status: 'success',
      completedAt: 2,
      value: value ?? null,
    };
  }
  if (status === 'empty') {
    return { ...active, status: 'empty', completedAt: 2 };
  }
  return {
    ...active,
    status: 'error',
    completedAt: 2,
    error: { code: 'DATA_FAILED', message: String(value), retryable: false },
  };
};

describe('PIRRenderer Collection conformance', () => {
  it('keeps nested parent scope and Component state attached to stable item keys', () => {
    const alpha = {
      id: 'alpha',
      label: 'Group Alpha',
      children: [
        { id: 'alpha-one', name: 'Alpha One' },
        { id: 'alpha-two', name: 'Alpha Two' },
      ],
    } as const;
    const beta = {
      id: 'beta',
      label: 'Group Beta',
      children: [{ id: 'beta-one', name: 'Beta One' }],
    } as const;
    const definition = createCounterDefinition();
    const dispatchTrigger = vi.fn((request) => {
      if (request.trigger.kind !== 'call-code') return;
      request.setStateById('count', Number(request.scope.stateById.count) + 1);
    });
    const page = createNestedCollectionPage([alpha, beta]);
    const rendered = render(
      <PIRRenderer
        plan={createProjectionPlan('page', [page, definition])}
        host={nativeHost}
        dispatchTrigger={dispatchTrigger}
        onBlockingIssues={vi.fn()}
      />
    );

    expect(screen.getAllByText('Group Alpha')).toHaveLength(3);
    expect(screen.getAllByText('Group Beta')).toHaveLength(2);
    const alphaOne = screen.getByRole('button', { name: 'Alpha One' });
    fireEvent.click(alphaOne);
    expect(alphaOne.textContent).toBe('1');

    const reorderedPage = createNestedCollectionPage([beta, alpha]);
    rendered.rerender(
      <PIRRenderer
        plan={createProjectionPlan('page', [reorderedPage, definition])}
        host={nativeHost}
        dispatchTrigger={dispatchTrigger}
        onBlockingIssues={vi.fn()}
      />
    );
    expect(screen.getByRole('button', { name: 'Alpha One' }).textContent).toBe(
      '1'
    );
    expect(screen.getByRole('button', { name: 'Beta One' }).textContent).toBe(
      '0'
    );
  });

  it.each([
    ['auto', 'item-region'],
    ['item', 'item-region'],
    ['empty', 'empty-region'],
    ['loading', 'loading-region'],
    ['error', 'manual-error'],
  ] as const)('projects the %s preview state', (state, expectedText) => {
    const page = createWorkspaceDocument({
      id: 'page',
      type: 'pir-page',
      rootId: 'collection',
      nodesById: {
        collection: {
          id: 'collection',
          kind: 'collection',
          source: { kind: 'literal', value: [{ id: 'one' }] },
          key: {
            kind: 'binding',
            value: {
              kind: 'collection-symbol',
              symbolId: 'item',
              path: 'id',
            },
          },
          symbols: {
            itemId: 'item',
            itemName: 'item',
            indexId: 'index',
            indexName: 'index',
            errorId: 'error',
          },
        },
        item: {
          id: 'item',
          kind: 'element',
          type: 'p',
          text: { kind: 'literal', value: 'item-region' },
        },
        empty: {
          id: 'empty',
          kind: 'element',
          type: 'p',
          text: { kind: 'literal', value: 'empty-region' },
        },
        loading: {
          id: 'loading',
          kind: 'element',
          type: 'p',
          text: { kind: 'literal', value: 'loading-region' },
        },
        error: {
          id: 'error',
          kind: 'element',
          type: 'p',
          text: {
            kind: 'collection-symbol',
            symbolId: 'error',
            path: 'message',
          },
        },
      },
      regionsById: {
        collection: {
          item: ['item'],
          empty: ['empty'],
          loading: ['loading'],
          error: ['error'],
        },
      },
    });
    const preview: PIRCollectionPreviewInput =
      state === 'error'
        ? { state, errorValue: { message: 'manual-error' } }
        : { state };
    render(
      <PIRRenderer
        plan={createProjectionPlan('page', [page])}
        host={nativeHost}
        resolveCollectionPreviewState={() => preview}
        dispatchTrigger={vi.fn()}
        onBlockingIssues={vi.fn()}
      />
    );

    expect(screen.getByText(expectedText)).toBeTruthy();
  });

  it('resolves manual preview state by the full Component instance path', () => {
    const definition = createWorkspaceDocument({
      id: 'list',
      type: 'pir-component',
      rootId: 'collection',
      contract: createContract(),
      nodesById: {
        collection: {
          id: 'collection',
          kind: 'collection',
          source: { kind: 'literal', value: ['value'] },
          key: { kind: 'index' },
          symbols: {
            itemId: 'item',
            itemName: 'item',
            indexId: 'index',
            indexName: 'index',
          },
        },
        item: {
          id: 'item',
          kind: 'element',
          type: 'p',
          text: { kind: 'literal', value: 'instance-item' },
        },
        loading: {
          id: 'loading',
          kind: 'element',
          type: 'p',
          text: { kind: 'literal', value: 'instance-loading' },
        },
      },
      regionsById: {
        collection: { item: ['item'], loading: ['loading'] },
      },
    });
    const instance = (id: string) => ({
      id,
      kind: 'component-instance' as const,
      componentDocumentId: 'list',
      bindings: { props: {}, events: {}, variants: {} },
    });
    const page = createWorkspaceDocument({
      id: 'page',
      type: 'pir-page',
      rootId: 'root',
      nodesById: {
        root: { id: 'root', kind: 'element', type: 'main' },
        left: instance('left'),
        right: instance('right'),
      },
      childIdsById: { root: ['left', 'right'] },
    });
    const leftPath = appendPirProjectionComponentPath(
      createPirProjectionRootPath('page'),
      'page',
      'left',
      'list'
    );
    const resolveCollectionPreviewState = vi.fn(
      (location) =>
        ({
          state: location.instancePath === leftPath ? 'loading' : 'auto',
        }) as const
    );
    render(
      <PIRRenderer
        plan={createProjectionPlan('page', [page, definition])}
        host={nativeHost}
        resolveCollectionPreviewState={resolveCollectionPreviewState}
        dispatchTrigger={vi.fn()}
        onBlockingIssues={vi.fn()}
      />
    );

    expect(screen.getByText('instance-loading')).toBeTruthy();
    expect(screen.getByText('instance-item')).toBeTruthy();
    expect(
      new Set(
        resolveCollectionPreviewState.mock.calls.map(
          ([location]) => location.instancePath
        )
      )
    ).toEqual(
      new Set([
        leftPath,
        appendPirProjectionComponentPath(
          createPirProjectionRootPath('page'),
          'page',
          'right',
          'list'
        ),
      ])
    );
    for (const [location] of resolveCollectionPreviewState.mock.calls) {
      expect(Object.keys(location).sort()).toEqual([
        'documentId',
        'instancePath',
        'nodeId',
      ]);
      expect(location).not.toHaveProperty('role');
    }
  });

  it.each([
    [lifecycleSnapshot('idle'), 'lifecycle-loading'],
    [lifecycleSnapshot('loading'), 'lifecycle-loading'],
    [
      lifecycleSnapshot('success', [{ id: 'one', name: 'lifecycle-item' }]),
      'lifecycle-item',
    ],
    [lifecycleSnapshot('empty'), 'lifecycle-empty'],
    [lifecycleSnapshot('error', 'lifecycle-error'), 'lifecycle-error'],
  ] as const)(
    'maps the %s Data lifecycle without inferring Collection state',
    (snapshot, expectedText) => {
      const page = createLifecycleCollectionDocument('page');
      const dataOperationRuntime: PIRDataOperationRuntimePort = {
        resolveSnapshot: () => snapshot,
      };
      render(
        <PIRRenderer
          plan={createProjectionPlan('page', [page])}
          host={nativeHost}
          dataOperationRuntime={dataOperationRuntime}
          dispatchTrigger={vi.fn()}
          onBlockingIssues={vi.fn()}
        />
      );

      expect(screen.getByText(expectedText)).toBeTruthy();
    }
  );

  it('isolates lifecycle snapshots by Component instance and lets manual preview win', () => {
    const definition = createLifecycleCollectionDocument(
      'product-list',
      'pir-component'
    );
    const page = createWorkspaceDocument({
      id: 'page',
      type: 'pir-page',
      rootId: 'root',
      nodesById: {
        root: { id: 'root', kind: 'element', type: 'main' },
        left: {
          id: 'left',
          kind: 'component-instance',
          componentDocumentId: 'product-list',
          bindings: { props: {}, events: {}, variants: {} },
        },
        right: {
          id: 'right',
          kind: 'component-instance',
          componentDocumentId: 'product-list',
          bindings: { props: {}, events: {}, variants: {} },
        },
      },
      childIdsById: { root: ['left', 'right'] },
    });
    const leftPath = appendPirProjectionComponentPath(
      createPirProjectionRootPath('page'),
      'page',
      'left',
      'product-list'
    );
    const resolveSnapshot = vi.fn(
      (
        request: Parameters<PIRDataOperationRuntimePort['resolveSnapshot']>[0]
      ) =>
        lifecycleSnapshot('success', [
          {
            id: request.instancePath,
            name:
              request.instancePath === leftPath ? 'left-item' : 'right-item',
          },
        ])
    );
    render(
      <PIRRenderer
        plan={createProjectionPlan('page', [page, definition])}
        host={nativeHost}
        dataOperationRuntime={{ resolveSnapshot }}
        resolveCollectionPreviewState={(location) => ({
          state: location.instancePath === leftPath ? 'loading' : 'auto',
        })}
        dispatchTrigger={vi.fn()}
        onBlockingIssues={vi.fn()}
      />
    );

    expect(screen.getByText('lifecycle-loading')).toBeTruthy();
    expect(screen.queryByText('left-item')).toBeNull();
    expect(screen.getByText('right-item')).toBeTruthy();
    expect(
      new Set(
        resolveSnapshot.mock.calls.map(([request]) => request.instancePath)
      ).size
    ).toBe(2);
  });

  it('fails closed when a durable data binding has no runtime snapshot', async () => {
    const page = createLifecycleCollectionDocument('page');
    const onBlockingIssues = vi.fn();
    render(
      <PIRRenderer
        plan={createProjectionPlan('page', [page])}
        host={nativeHost}
        dispatchTrigger={vi.fn()}
        onBlockingIssues={onBlockingIssues}
      />
    );

    expect(screen.queryByText('lifecycle-loading')).toBeNull();
    await waitFor(() =>
      expect(onBlockingIssues).toHaveBeenLastCalledWith([
        expect.objectContaining({
          code: 'PIR_RENDER_DATA_LIFECYCLE_UNAVAILABLE',
          documentId: 'page',
          dataId: 'products',
        }),
      ])
    );
  });

  it('fails closed and reports a dynamic non-array source', async () => {
    const page = createWorkspaceDocument({
      id: 'page',
      type: 'pir-page',
      rootId: 'collection',
      nodesById: {
        collection: {
          id: 'collection',
          kind: 'collection',
          source: {
            kind: 'binding',
            value: { kind: 'param', paramId: 'items' },
          },
          key: { kind: 'index' },
          symbols: {
            itemId: 'item',
            itemName: 'item',
            indexId: 'index',
            indexName: 'index',
          },
        },
        item: {
          id: 'item',
          kind: 'element',
          type: 'p',
          text: { kind: 'literal', value: 'must-not-render' },
        },
      },
      regionsById: { collection: { item: ['item'] } },
    });
    const onBlockingIssues = vi.fn();
    render(
      <PIRRenderer
        plan={createProjectionPlan('page', [page])}
        host={nativeHost}
        rootParamsById={{ items: { not: 'an array' } }}
        dispatchTrigger={vi.fn()}
        onBlockingIssues={onBlockingIssues}
      />
    );

    expect(screen.queryByText('must-not-render')).toBeNull();
    await waitFor(() =>
      expect(onBlockingIssues).toHaveBeenLastCalledWith([
        expect.objectContaining({
          code: 'PIR_RENDER_COLLECTION_PROJECTION_BLOCKED',
          documentId: 'page',
          nodeId: 'collection',
        }),
      ])
    );
  });

  it('locates a dynamic Collection issue to one Component instance path', async () => {
    const definition = createWorkspaceDocument({
      id: 'list',
      type: 'pir-component',
      rootId: 'collection',
      contract: createContract({
        propsById: {
          items: { id: 'items', name: 'Items', typeRef: 'unknown' },
        },
      }),
      nodesById: {
        collection: {
          id: 'collection',
          kind: 'collection',
          source: {
            kind: 'binding',
            value: { kind: 'component-prop', memberId: 'items' },
          },
          key: { kind: 'index' },
          symbols: {
            itemId: 'item',
            itemName: 'item',
            indexId: 'index',
            indexName: 'index',
          },
        },
        item: {
          id: 'item',
          kind: 'element',
          type: 'p',
          text: { kind: 'collection-symbol', symbolId: 'item' },
        },
      },
      regionsById: { collection: { item: ['item'] } },
    });
    const instance = (id: string, items: PIRJsonValue) => ({
      id,
      kind: 'component-instance' as const,
      componentDocumentId: 'list',
      bindings: {
        props: { items: { kind: 'literal' as const, value: items } },
        events: {},
        variants: {},
      },
    });
    const page = createWorkspaceDocument({
      id: 'page',
      type: 'pir-page',
      rootId: 'root',
      nodesById: {
        root: { id: 'root', kind: 'element', type: 'main' },
        left: instance('left', { invalid: true }),
        right: instance('right', ['right-item']),
      },
      childIdsById: { root: ['left', 'right'] },
    });
    const rootPath = createPirProjectionRootPath('page');
    const leftPath = appendPirProjectionComponentPath(
      rootPath,
      'page',
      'left',
      'list'
    );
    const rightPath = appendPirProjectionComponentPath(
      rootPath,
      'page',
      'right',
      'list'
    );
    const onBlockingIssues = vi.fn();
    render(
      <PIRRenderer
        plan={createProjectionPlan('page', [page, definition])}
        host={nativeHost}
        dispatchTrigger={vi.fn()}
        onBlockingIssues={onBlockingIssues}
      />
    );

    expect(screen.getByText('right-item')).toBeTruthy();
    await waitFor(() =>
      expect(onBlockingIssues).toHaveBeenLastCalledWith([
        expect.objectContaining({
          code: 'PIR_RENDER_COLLECTION_PROJECTION_BLOCKED',
          causeCode: 'PIR_COLLECTION_SOURCE_NOT_ARRAY',
          documentId: 'list',
          nodeId: 'collection',
          instancePath: leftPath,
        }),
      ])
    );
    const latestIssues = onBlockingIssues.mock.calls.at(-1)?.[0] ?? [];
    expect(latestIssues).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ instancePath: rightPath }),
      ])
    );
  });
});
