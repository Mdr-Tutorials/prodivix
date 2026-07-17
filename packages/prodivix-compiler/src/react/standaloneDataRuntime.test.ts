import { transformWithEsbuild } from 'vite';
import { describe, expect, it, vi } from 'vitest';
import Ajv2020 from 'ajv/dist/2020.js';
import type { WorkspaceSnapshot } from '@prodivix/workspace';
import { createWorkspaceStandaloneDataRuntimeModule } from './standaloneDataRuntime';

const workspace: WorkspaceSnapshot = {
  id: 'standalone-data-runtime',
  workspaceRev: 1,
  routeRev: 1,
  opSeq: 1,
  treeRootId: 'root',
  treeById: {
    root: {
      id: 'root',
      kind: 'dir',
      name: '/',
      parentId: null,
      children: ['data-node'],
    },
    'data-node': {
      id: 'data-node',
      kind: 'doc',
      name: 'products.data.json',
      parentId: 'root',
      docId: 'data-products',
    },
  },
  docsById: {
    'data-products': {
      id: 'data-products',
      type: 'data-source',
      path: '/products.data.json',
      contentRev: 1,
      metaRev: 1,
      content: {
        source: {
          id: 'products',
          adapterId: 'core.http',
          runtimeZone: 'client',
          bindingsById: {},
          configurationByKey: {},
        },
        schemasById: {
          product: {
            id: 'product',
            schema: {
              $schema: 'https://json-schema.org/draft/2020-12/schema',
              type: 'object',
            },
          },
          products: {
            id: 'products',
            schema: {
              $schema: 'https://json-schema.org/draft/2020-12/schema',
              type: 'array',
            },
          },
        },
        operationsById: {
          'list-products': {
            id: 'list-products',
            kind: 'query',
            outputSchemaId: 'products',
            configurationByKey: {},
            policies: {},
          },
          'create-product': {
            id: 'create-product',
            kind: 'mutation',
            outputSchemaId: 'product',
            configurationByKey: {},
            policies: {},
          },
        },
      },
    },
  },
  routeManifest: { version: '1', root: { id: 'root-route' } },
};

type Runtime = Readonly<{
  subscribeDataLifecycle(listener: () => void): () => void;
  subscribeNetworkTrace(listener: (trace: unknown) => void): () => void;
  resolveDataLifecycleSnapshot(request: unknown): Readonly<{
    status: string;
    value?: unknown;
    page?: unknown;
    sequence?: number;
  }>;
  activateDataBindings(request: unknown): Promise<void>;
  dispatchDataMutation(request: unknown): Promise<unknown>;
  dispose(): void;
}>;

describe('standalone Data runtime projection', () => {
  it('publishes loading then success from the provider-projected fixture asset', async () => {
    const generated = createWorkspaceStandaloneDataRuntimeModule(workspace);
    const transformed = await transformWithEsbuild(
      generated.body,
      'prodivix-data-runtime.ts',
      { loader: 'ts', target: 'es2022', format: 'cjs' }
    );
    const fetch = vi.fn(async (input: string | URL | Request) => {
      if (String(input).endsWith('/.prodivix/data-runtime.json'))
        return Response.json({
          format: 'prodivix.executable-data-runtime.v1',
          mode: 'mock',
        });
      return Response.json({
        fixtureSetId: 'standalone-test',
        emulatedAdapterIds: ['core.http'],
        fixtures: [
          {
            id: 'products',
            documentId: 'data-products',
            operationId: 'list-products',
            operationKind: 'query',
            behavior: {
              kind: 'result',
              value: [{ id: 'p1' }],
              empty: false,
            },
          },
        ],
      });
    });
    const record: { exports: Record<string, unknown> } = { exports: {} };
    Function(
      'module',
      'exports',
      'fetch',
      'Ajv2020',
      transformed.code
    )(record, record.exports, fetch, Ajv2020);
    const runtime = (
      record.exports.createWorkspaceDataRuntime as () => Runtime
    )();
    const request = {
      documentId: 'page',
      instancePath: '/page',
      dataId: 'products',
      binding: {
        operation: {
          documentId: 'data-products',
          operationId: 'list-products',
        },
      },
    };
    expect(runtime.resolveDataLifecycleSnapshot(request).status).toBe('idle');
    await runtime.activateDataBindings({
      documentId: 'page',
      instancePath: '/page',
      bindingsByDataId: { products: request.binding },
      runtimeValuesById: {},
    });
    expect(runtime.resolveDataLifecycleSnapshot(request)).toMatchObject({
      status: 'success',
      value: [{ id: 'p1' }],
    });
    expect(fetch).toHaveBeenCalledWith(
      '/.prodivix/data-runtime.json',
      expect.objectContaining({ credentials: 'same-origin', cache: 'no-store' })
    );
    expect(fetch).toHaveBeenCalledWith(
      '/.prodivix/data-mock-provision.json',
      expect.objectContaining({ credentials: 'same-origin', cache: 'no-store' })
    );
    const routeBinding = {
      ...request.binding,
      activations: [{ kind: 'route', routeId: 'catalog-route' }],
    } as const;
    const routeRequest = {
      ...request,
      dataId: 'route-products',
      binding: routeBinding,
    };
    await runtime.activateDataBindings({
      documentId: 'page',
      instancePath: '/page',
      currentRouteId: 'other-route',
      bindingsByDataId: { 'route-products': routeBinding },
      runtimeValuesById: {},
    });
    expect(runtime.resolveDataLifecycleSnapshot(routeRequest).status).toBe(
      'idle'
    );
    await runtime.activateDataBindings({
      documentId: 'page',
      instancePath: '/page',
      currentRouteId: 'catalog-route',
      bindingsByDataId: { 'route-products': routeBinding },
      runtimeValuesById: {},
    });
    expect(runtime.resolveDataLifecycleSnapshot(routeRequest).status).toBe(
      'success'
    );
    runtime.dispose();
  });

  it('maps input-change values, suppresses unchanged dispatch, and revalidates CRUD after mutation', async () => {
    const generated = createWorkspaceStandaloneDataRuntimeModule(workspace);
    const transformed = await transformWithEsbuild(
      generated.body,
      'prodivix-data-runtime.ts',
      { loader: 'ts', target: 'es2022', format: 'cjs' }
    );
    const fetch = vi.fn(async (input: string | URL | Request) => {
      if (String(input).endsWith('/.prodivix/data-runtime.json'))
        return Response.json({
          format: 'prodivix.executable-data-runtime.v1',
          mode: 'mock',
        });
      return Response.json({
        fixtureSetId: 'standalone-crud',
        emulatedAdapterIds: ['core.http'],
        collections: [
          {
            id: 'products',
            entityIdKey: 'id',
            initialEntities: [{ id: 'p1', name: 'Alpha' }],
          },
        ],
        fixtures: [
          {
            id: 'list-products',
            documentId: 'data-products',
            operationId: 'list-products',
            operationKind: 'query',
            behavior: {
              kind: 'crud',
              collectionId: 'products',
              action: 'list',
            },
          },
          {
            id: 'create-product',
            documentId: 'data-products',
            operationId: 'create-product',
            operationKind: 'mutation',
            behavior: {
              kind: 'crud',
              collectionId: 'products',
              action: 'create',
              valueInputKey: 'product',
            },
          },
        ],
      });
    });
    const record: { exports: Record<string, unknown> } = { exports: {} };
    Function(
      'module',
      'exports',
      'fetch',
      'Ajv2020',
      transformed.code
    )(record, record.exports, fetch, Ajv2020);
    const runtime = (
      record.exports.createWorkspaceDataRuntime as () => Runtime
    )();
    const binding = {
      operation: {
        documentId: 'data-products',
        operationId: 'list-products',
      },
      input: {
        kind: 'object',
        propertiesByKey: {
          filter: { kind: 'runtime-value', valueId: 'filter-symbol' },
        },
      },
      activations: [{ kind: 'input-change', dependencyId: 'filter-symbol' }],
    } as const;
    const request = {
      documentId: 'page',
      instancePath: '/page',
      dataId: 'products',
      binding,
    };

    await runtime.activateDataBindings({
      documentId: 'page',
      instancePath: '/page',
      bindingsByDataId: { products: binding },
      runtimeValuesById: { 'filter-symbol': 'active' },
    });
    expect(runtime.resolveDataLifecycleSnapshot(request)).toMatchObject({
      status: 'success',
      sequence: 1,
      value: [{ id: 'p1', name: 'Alpha' }],
    });

    await runtime.activateDataBindings({
      documentId: 'page',
      instancePath: '/page',
      bindingsByDataId: { products: binding },
      runtimeValuesById: { 'filter-symbol': 'active' },
    });
    expect(runtime.resolveDataLifecycleSnapshot(request).sequence).toBe(1);

    await runtime.dispatchDataMutation({
      binding: {
        kind: 'dispatch-data-operation',
        operation: {
          documentId: 'data-products',
          operationId: 'create-product',
        },
        input: {
          kind: 'object',
          propertiesByKey: {
            product: { kind: 'trigger-payload', path: '/product' },
          },
        },
      },
      payload: { product: { id: 'p2', name: 'Beta' } },
      runtimeValuesById: {},
      source: {
        documentId: 'page',
        nodeId: 'create',
        eventName: 'onClick',
        instancePath: '/page/create',
      },
    });
    expect(runtime.resolveDataLifecycleSnapshot(request)).toMatchObject({
      status: 'success',
      sequence: 3,
      value: [
        { id: 'p1', name: 'Alpha' },
        { id: 'p2', name: 'Beta' },
      ],
    });
    expect(fetch).toHaveBeenCalledTimes(2);
    runtime.dispose();
  });

  it('executes public live HTTP with schema, retry, pagination, cache, and sanitized correlation', async () => {
    const liveWorkspace: WorkspaceSnapshot = {
      ...workspace,
      docsById: {
        'data-products': {
          ...workspace.docsById['data-products']!,
          content: {
            source: {
              id: 'products',
              adapterId: 'core.http',
              runtimeZone: 'client',
              bindingsById: {},
              configurationByKey: {
                baseUrl: {
                  kind: 'literal',
                  value: 'https://api.example.test/v1/',
                },
              },
            },
            schemasById: {
              input: {
                id: 'input',
                schema: {
                  $schema: 'https://json-schema.org/draft/2020-12/schema',
                  type: 'object',
                  properties: {
                    offset: { type: 'integer' },
                    limit: { type: 'integer' },
                  },
                  required: ['offset', 'limit'],
                  additionalProperties: false,
                },
              },
              products: {
                id: 'products',
                schema: {
                  $schema: 'https://json-schema.org/draft/2020-12/schema',
                  type: 'object',
                  properties: {
                    items: { type: 'array' },
                    meta: {
                      type: 'object',
                      properties: { total: { type: 'integer' } },
                      required: ['total'],
                    },
                  },
                  required: ['items', 'meta'],
                },
              },
            },
            operationsById: {
              'list-products': {
                id: 'list-products',
                kind: 'query',
                inputSchemaId: 'input',
                outputSchemaId: 'products',
                configurationByKey: {
                  method: { kind: 'literal', value: 'GET' },
                  path: { kind: 'literal', value: '/products' },
                  emptyWhen: { kind: 'literal', value: 'never' },
                },
                policies: {
                  retry: {
                    maxAttempts: 2,
                    backoff: 'fixed',
                    initialDelayMs: 0,
                  },
                  pagination: {
                    kind: 'offset',
                    offsetInput: 'offset',
                    limitInput: 'limit',
                    defaultLimit: 10,
                    totalPath: '/meta/total',
                  },
                  cache: { strategy: 'cache-first', ttlMs: 60_000 },
                },
              },
            },
          },
        },
      },
    };
    const generated = createWorkspaceStandaloneDataRuntimeModule(liveWorkspace);
    const transformed = await transformWithEsbuild(
      generated.body,
      'prodivix-data-runtime.ts',
      { loader: 'ts', target: 'es2022', format: 'cjs' }
    );
    let apiAttempt = 0;
    const fetch = vi.fn(async (input: string | URL | Request) => {
      if (String(input).endsWith('/.prodivix/data-runtime.json'))
        return Response.json({
          format: 'prodivix.executable-data-runtime.v1',
          mode: 'live',
        });
      apiAttempt += 1;
      return new Response(
        apiAttempt === 1
          ? '{}'
          : JSON.stringify({ items: [{ id: 'p1' }], meta: { total: 21 } }),
        {
          status: apiAttempt === 1 ? 503 : 200,
          headers: { 'content-type': 'application/json' },
        }
      );
    });
    const record: { exports: Record<string, unknown> } = { exports: {} };
    Function(
      'module',
      'exports',
      'fetch',
      'Ajv2020',
      transformed.code
    )(record, record.exports, fetch, Ajv2020);
    const runtime = (
      record.exports.createWorkspaceDataRuntime as () => Runtime
    )();
    const traces: Array<Record<string, unknown>> = [];
    runtime.subscribeNetworkTrace((trace) =>
      traces.push(trace as Record<string, unknown>)
    );
    const binding = {
      operation: {
        documentId: 'data-products',
        operationId: 'list-products',
      },
      input: { kind: 'literal', value: {} },
    } as const;
    const request = {
      documentId: 'page',
      instancePath: '/page',
      dataId: 'products',
      binding,
    };
    await runtime.activateDataBindings({
      documentId: 'page',
      instancePath: '/page',
      bindingsByDataId: { products: binding },
      runtimeValuesById: {},
    });
    expect(runtime.resolveDataLifecycleSnapshot(request)).toMatchObject({
      status: 'success',
      value: { items: [{ id: 'p1' }], meta: { total: 21 } },
      page: {
        kind: 'offset',
        offset: 0,
        limit: 10,
        total: 21,
        hasMore: true,
      },
    });
    expect(traces).toEqual([
      expect.objectContaining({
        sanitizedUrl: 'https://api.example.test/',
        status: 503,
        redacted: true,
        correlation: expect.objectContaining({ attempt: 1 }),
      }),
      expect.objectContaining({
        sanitizedUrl: 'https://api.example.test/',
        status: 200,
        redacted: true,
        correlation: expect.objectContaining({ attempt: 2 }),
      }),
    ]);
    await runtime.activateDataBindings({
      documentId: 'page',
      instancePath: '/page-cache',
      bindingsByDataId: { products: binding },
      runtimeValuesById: {},
    });
    expect(apiAttempt).toBe(2);
    expect(JSON.stringify(traces)).not.toContain('/products');
    runtime.dispose();
  });

  it('never falls back to live HTTP when explicit mock provisioning is missing', async () => {
    const generated = createWorkspaceStandaloneDataRuntimeModule(workspace);
    const transformed = await transformWithEsbuild(
      generated.body,
      'prodivix-data-runtime.ts',
      { loader: 'ts', target: 'es2022', format: 'cjs' }
    );
    const fetch = vi.fn(async (input: string | URL | Request) => {
      if (String(input).endsWith('/.prodivix/data-runtime.json'))
        return Response.json({
          format: 'prodivix.executable-data-runtime.v1',
          mode: 'mock',
        });
      return new Response('', { status: 404 });
    });
    const record: { exports: Record<string, unknown> } = { exports: {} };
    Function(
      'module',
      'exports',
      'fetch',
      'Ajv2020',
      transformed.code
    )(record, record.exports, fetch, Ajv2020);
    const runtime = (
      record.exports.createWorkspaceDataRuntime as () => Runtime
    )();
    const binding = {
      operation: {
        documentId: 'data-products',
        operationId: 'list-products',
      },
    } as const;
    const request = {
      documentId: 'page',
      instancePath: '/page',
      dataId: 'products',
      binding,
    };
    await runtime.activateDataBindings({
      documentId: 'page',
      instancePath: '/page',
      bindingsByDataId: { products: binding },
      runtimeValuesById: {},
    });
    expect(runtime.resolveDataLifecycleSnapshot(request)).toMatchObject({
      status: 'error',
      error: { code: 'DATA_MOCK_PROVISION_UNAVAILABLE' },
    });
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(
      fetch.mock.calls.some(([input]) => String(input).startsWith('http'))
    ).toBe(false);
    runtime.dispose();
  });
});
