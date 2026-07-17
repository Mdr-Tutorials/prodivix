import {
  createDataLifecycleChannel,
  createDataOperationInvocation,
  type DataConfigurationValue,
  type DataOperationPolicies,
  type DataSourceDocument,
} from '@prodivix/data';
import { createExecutableProjectSnapshot } from '@prodivix/runtime-core';
import { describe, expect, it, vi } from 'vitest';
import {
  createBrowserDataExecutionEnvironment,
  createBrowserTestDataExecutionEnvironment,
} from './browserDataExecutionEnvironment';

const createDocument = (
  sourceConfiguration: Readonly<Record<string, DataConfigurationValue>> = {},
  operationConfiguration: Readonly<Record<string, DataConfigurationValue>> = {},
  policies: DataOperationPolicies = {}
): DataSourceDocument => ({
  source: {
    id: 'products-source',
    adapterId: 'core.http',
    runtimeZone: 'client',
    bindingsById: {},
    configurationByKey: sourceConfiguration,
  },
  schemasById: {
    products: { id: 'products', schema: true },
  },
  operationsById: {
    'list-products': {
      id: 'list-products',
      kind: 'query',
      outputSchemaId: 'products',
      configurationByKey: operationConfiguration,
      policies,
    },
  },
});

describe('Browser Data execution composition', () => {
  it('carries one correlation identity through Data, HTTP, browser fetch, and Network trace', async () => {
    const fetch = vi.fn(
      async () => new Response('{"items":[{"id":"p1"}]}', { status: 200 })
    );
    const published: unknown[] = [];
    const environment = createBrowserDataExecutionEnvironment({
      fetch: fetch as typeof globalThis.fetch,
      now: (() => {
        let value = 100;
        return () => value++;
      })(),
    });
    const invocation = createDataOperationInvocation({
      invocationId: 'invocation-products-1',
      sequence: 4,
      attempt: 1,
      startedAt: 100,
      operation: {
        documentId: 'data-products',
        operationId: 'list-products',
      },
      documentRevision: '11',
      runtimeZone: 'client',
      mode: 'live',
      activation: 'route',
      input: { page: 2 },
      sourceTrace: [
        {
          sourceRef: {
            kind: 'data-operation',
            documentId: 'data-products',
            operationId: 'list-products',
          },
        },
      ],
    });
    const result = await environment.execute({
      invocation,
      document: createDocument(
        {
          baseUrl: {
            kind: 'literal',
            value: 'https://api.example.test/v1/',
          },
        },
        {
          method: { kind: 'literal', value: 'GET' },
          path: { kind: 'literal', value: '/products' },
        }
      ),
      lifecycleChannel: createDataLifecycleChannel(),
      signal: new AbortController().signal,
      publishNetworkTrace: (trace) => published.push(trace),
    });

    expect(fetch).toHaveBeenCalledWith(
      new URL('https://api.example.test/products?page=2'),
      expect.objectContaining({ method: 'GET', credentials: 'omit' })
    );
    expect(result.result).toEqual({
      value: { items: [{ id: 'p1' }] },
      empty: false,
    });
    expect(published).toEqual([
      expect.objectContaining({
        sanitizedUrl: 'https://api.example.test/',
        correlation: {
          kind: 'data-operation',
          documentId: 'data-products',
          operationId: 'list-products',
          invocationId: 'invocation-products-1',
          sequence: 4,
          attempt: 1,
        },
        sourceTrace: invocation.sourceTrace,
      }),
    ]);
    expect(JSON.stringify(published)).not.toContain('page=2');
  });

  it('runs the same HTTP source through an exact mock fixture without network access', async () => {
    const fetch = vi.fn();
    const environment = createBrowserTestDataExecutionEnvironment({
      fetch: fetch as typeof globalThis.fetch,
      mock: {
        fixtureSetId: 'catalog-test',
        fixtures: [
          {
            id: 'products-page-2',
            operation: {
              documentId: 'data-products',
              operationId: 'list-products',
            },
            operationKind: 'query',
            input: { page: 2 },
            behavior: {
              kind: 'result',
              value: { items: [{ id: 'fixture-product' }] },
              empty: false,
            },
          },
        ],
      },
    });
    const invocation = createDataOperationInvocation({
      invocationId: 'invocation-products-test',
      sequence: 1,
      attempt: 1,
      startedAt: 100,
      operation: {
        documentId: 'data-products',
        operationId: 'list-products',
      },
      documentRevision: '11',
      runtimeZone: 'client',
      mode: 'mock',
      activation: 'test',
      input: { page: 2 },
    });
    const execute = () =>
      environment.execute({
        invocation,
        document: createDocument(
          {
            baseUrl: {
              kind: 'literal',
              value: 'https://api.example.test/v1/',
            },
          },
          {
            method: { kind: 'literal', value: 'GET' },
            path: { kind: 'literal', value: '/products' },
          }
        ),
        lifecycleChannel: createDataLifecycleChannel(),
        signal: new AbortController().signal,
      });

    await expect(execute()).resolves.toMatchObject({
      lifecycle: {
        status: 'success',
        value: { items: [{ id: 'fixture-product' }] },
      },
      networkTraces: [],
    });
    expect(fetch).not.toHaveBeenCalled();
    environment.dispose();
    await expect(execute()).rejects.toMatchObject({
      code: 'DATA_MOCK_RUNTIME_DISPOSED',
    });
  });

  it('owns one bounded cache per Browser Data environment', async () => {
    const fetch = vi.fn(
      async () => new Response('{"items":[{"id":"cached"}]}', { status: 200 })
    );
    const environment = createBrowserDataExecutionEnvironment({
      fetch: fetch as typeof globalThis.fetch,
    });
    const document = createDocument(
      {
        baseUrl: {
          kind: 'literal',
          value: 'https://api.example.test/v1/',
        },
      },
      {
        method: { kind: 'literal', value: 'GET' },
        path: { kind: 'literal', value: '/products' },
      },
      { cache: { strategy: 'cache-first', ttlMs: 60_000 } }
    );
    const lifecycleChannel = createDataLifecycleChannel();
    const execute = (sequence: number) =>
      environment.execute({
        invocation: createDataOperationInvocation({
          invocationId: `browser-cache-${sequence}`,
          sequence,
          attempt: 1,
          startedAt: 100,
          operation: {
            documentId: 'data-products',
            operationId: 'list-products',
          },
          documentRevision: '11',
          runtimeZone: 'client',
          mode: 'live',
          activation: 'route',
          input: { page: 1 },
        }),
        document,
        lifecycleChannel,
        signal: new AbortController().signal,
      });

    await expect(execute(1)).resolves.toMatchObject({
      cache: { status: 'network' },
    });
    await expect(execute(2)).resolves.toMatchObject({
      result: { value: { items: [{ id: 'cached' }] } },
      cache: { status: 'hit-fresh' },
      networkTraces: [],
    });
    expect(fetch).toHaveBeenCalledTimes(1);
    environment.dispose();
  });

  it('denies Browser Test live Data unless explicitly enabled', () => {
    const environment = createBrowserTestDataExecutionEnvironment({
      mock: { fixtureSetId: 'empty', fixtures: [] },
    });
    expect(() =>
      environment.execute({
        invocation: createDataOperationInvocation({
          invocationId: 'live-test',
          sequence: 1,
          attempt: 1,
          startedAt: 100,
          operation: {
            documentId: 'data-products',
            operationId: 'list-products',
          },
          documentRevision: '11',
          runtimeZone: 'client',
          mode: 'live',
          activation: 'test',
          input: {},
        }),
        document: createDocument(),
        lifecycleChannel: createDataLifecycleChannel(),
        signal: new AbortController().signal,
      })
    ).toThrow(/denies live mode/u);
  });

  it('dispatches typed query input and suppresses unchanged Browser activations', async () => {
    const fetch = vi.fn(
      async () => new Response('{"items":[{"id":"p1"}]}', { status: 200 })
    );
    const environment = createBrowserDataExecutionEnvironment({
      fetch: fetch as typeof globalThis.fetch,
      now: () => 100,
    });
    const document = createDocument(
      {
        baseUrl: {
          kind: 'literal',
          value: 'https://api.example.test/v1/',
        },
      },
      {
        method: { kind: 'literal', value: 'GET' },
        path: { kind: 'literal', value: '/products' },
      }
    );
    const request = {
      operation: {
        documentId: 'data-products',
        operationId: 'list-products',
      },
      documentRevision: '11',
      runtimeZone: 'client',
      mode: 'live',
      trigger: { kind: 'input-change', dependencyId: 'filters' },
      input: {
        kind: 'object',
        propertiesByKey: {
          search: { kind: 'trigger-payload', path: '/search' },
          page: { kind: 'literal', value: 2 },
        },
      },
      inputContext: { triggerPayload: { search: 'chair' } },
    } as const;
    const context = {
      request,
      document,
      lifecycleChannel: createDataLifecycleChannel(),
      signal: new AbortController().signal,
    };

    await expect(environment.dispatch(context)).resolves.toMatchObject({
      status: 'dispatched',
      invocation: {
        sequence: 1,
        activation: 'input-change',
        input: { page: 2, search: 'chair' },
      },
      result: { result: { value: { items: [{ id: 'p1' }] } } },
    });
    await expect(environment.dispatch(context)).resolves.toEqual({
      status: 'skipped-unchanged',
    });
    expect(fetch).toHaveBeenCalledTimes(1);
    environment.dispose();
  });

  it('provisions Browser Test fixtures from the exact executable snapshot', async () => {
    const snapshot = createExecutableProjectSnapshot({
      workspace: { workspaceId: 'workspace-1', snapshotId: 'snapshot-1' },
      target: { presetId: 'react-vite', framework: 'react', runtime: 'vite' },
      files: [{ path: 'package.json', contents: '{}' }],
      dependencyPlan: { manifestFilePath: 'package.json' },
      entrypoints: [{ kind: 'test', path: 'package.json' }],
      capabilityRequirements: { preview: [], build: [], test: [] },
      dataMockProvision: {
        fixtureSetId: 'browser-snapshot-fixtures',
        emulatedAdapterIds: ['core.http'],
        fixtures: [
          {
            id: 'products',
            documentId: 'data-products',
            operationId: 'list-products',
            operationKind: 'query',
            behavior: {
              kind: 'result',
              value: [{ id: 'snapshot-product' }],
              empty: false,
            },
          },
        ],
      },
    });
    const environment = createBrowserTestDataExecutionEnvironment({
      snapshot,
    });

    await expect(
      environment.execute({
        invocation: createDataOperationInvocation({
          invocationId: 'snapshot-test',
          sequence: 1,
          attempt: 1,
          startedAt: 100,
          operation: {
            documentId: 'data-products',
            operationId: 'list-products',
          },
          documentRevision: '11',
          runtimeZone: 'client',
          mode: 'mock',
          activation: 'test',
          input: {},
        }),
        document: createDocument(),
        lifecycleChannel: createDataLifecycleChannel(),
        signal: new AbortController().signal,
      })
    ).resolves.toMatchObject({
      result: { value: [{ id: 'snapshot-product' }], empty: false },
    });
  });
});
