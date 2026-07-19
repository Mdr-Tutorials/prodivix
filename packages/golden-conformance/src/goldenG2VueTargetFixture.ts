import {
  projectExecutableProjectRuntimeFiles,
  type ExecutableProjectDataMockProvision,
  type ExecutableProjectSnapshot,
} from '@prodivix/runtime-core';
import { generateWorkspaceVueViteExecutableProject } from '@prodivix/prodivix-compiler';
import type { WorkspaceSnapshot } from '@prodivix/workspace';
import type { GoldenGeneratedProjectBundle } from './generatedProjectHarness';

export const GOLDEN_G2_VUE_WORKSPACE: WorkspaceSnapshot = {
  id: 'golden-g2-vue-data',
  name: 'Golden G2 Vue Data',
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
            name: 'List products',
            kind: 'query',
            outputSchemaId: 'products',
            configurationByKey: {},
            policies: {},
          },
          'create-product': {
            id: 'create-product',
            name: 'Create product',
            kind: 'mutation',
            outputSchemaId: 'product',
            configurationByKey: {},
            policies: {},
          },
          'get-product': {
            id: 'get-product',
            name: 'Get product',
            kind: 'query',
            outputSchemaId: 'product',
            configurationByKey: {},
            policies: {},
          },
          'update-product': {
            id: 'update-product',
            name: 'Update product',
            kind: 'mutation',
            outputSchemaId: 'product',
            configurationByKey: {},
            policies: {},
          },
          'delete-product': {
            id: 'delete-product',
            name: 'Delete product',
            kind: 'mutation',
            outputSchemaId: 'product',
            configurationByKey: {},
            policies: {},
          },
          'page-products': {
            id: 'page-products',
            name: 'Page products',
            kind: 'query',
            outputSchemaId: 'products',
            configurationByKey: {},
            policies: {
              pagination: {
                kind: 'offset',
                offsetInput: 'offset',
                limitInput: 'limit',
                defaultLimit: 20,
                maxLimit: 100,
                totalPath: '/total',
              },
            },
          },
          'error-products': {
            id: 'error-products',
            name: 'Error products',
            kind: 'query',
            outputSchemaId: 'products',
            configurationByKey: {},
            policies: {
              retry: {
                maxAttempts: 2,
                backoff: 'fixed',
                initialDelayMs: 0,
              },
            },
          },
        },
      },
    },
  },
  routeManifest: { version: '1', root: { id: 'root-route' } },
};

export const GOLDEN_G2_VUE_DATA_PROVISION: ExecutableProjectDataMockProvision =
  Object.freeze({
    fixtureSetId: 'golden-g2-vue-crud',
    emulatedAdapterIds: Object.freeze(['core.http']),
    collections: Object.freeze([
      Object.freeze({
        id: 'products',
        entityIdKey: 'id',
        initialEntities: Object.freeze([
          Object.freeze({ id: 'p1', name: 'Alpha' }),
        ]),
      }),
    ]),
    fixtures: Object.freeze([
      Object.freeze({
        id: 'list-products',
        documentId: 'data-products',
        operationId: 'list-products',
        operationKind: 'query' as const,
        behavior: Object.freeze({
          kind: 'crud' as const,
          collectionId: 'products',
          action: 'list' as const,
        }),
      }),
      Object.freeze({
        id: 'create-product',
        documentId: 'data-products',
        operationId: 'create-product',
        operationKind: 'mutation' as const,
        behavior: Object.freeze({
          kind: 'crud' as const,
          collectionId: 'products',
          action: 'create' as const,
          valueInputKey: 'product',
        }),
      }),
      Object.freeze({
        id: 'get-product',
        documentId: 'data-products',
        operationId: 'get-product',
        operationKind: 'query' as const,
        behavior: Object.freeze({
          kind: 'crud' as const,
          collectionId: 'products',
          action: 'get' as const,
          idInputKey: 'id',
        }),
      }),
      Object.freeze({
        id: 'update-product',
        documentId: 'data-products',
        operationId: 'update-product',
        operationKind: 'mutation' as const,
        behavior: Object.freeze({
          kind: 'crud' as const,
          collectionId: 'products',
          action: 'update' as const,
          idInputKey: 'id',
          valueInputKey: 'patch',
        }),
      }),
      Object.freeze({
        id: 'delete-product',
        documentId: 'data-products',
        operationId: 'delete-product',
        operationKind: 'mutation' as const,
        behavior: Object.freeze({
          kind: 'crud' as const,
          collectionId: 'products',
          action: 'delete' as const,
          idInputKey: 'id',
        }),
      }),
      Object.freeze({
        id: 'page-products',
        documentId: 'data-products',
        operationId: 'page-products',
        operationKind: 'query' as const,
        input: Object.freeze({ limit: 20, offset: 20 }),
        behavior: Object.freeze({
          kind: 'result' as const,
          value: Object.freeze([]),
          empty: true,
          delayMs: 250,
          page: Object.freeze({
            kind: 'offset' as const,
            offset: 20,
            limit: 20,
            total: 20,
            hasMore: false,
          }),
        }),
      }),
      Object.freeze({
        id: 'error-products',
        documentId: 'data-products',
        operationId: 'error-products',
        operationKind: 'query' as const,
        behavior: Object.freeze({
          kind: 'error' as const,
          code: 'GOLDEN_DATA_UNAVAILABLE',
          retryable: true,
        }),
      }),
    ]),
  });

export const createGoldenG2VueExecutableSnapshot =
  (): ExecutableProjectSnapshot => {
    const result = generateWorkspaceVueViteExecutableProject(
      GOLDEN_G2_VUE_WORKSPACE,
      {
        projectName: 'Golden G2 Vue Data',
        dataMockProvision: GOLDEN_G2_VUE_DATA_PROVISION,
      }
    );
    if (result.status === 'blocked')
      throw new Error(
        `Golden Vue target is blocked: ${JSON.stringify(result.diagnostics)}`
      );
    return result.snapshot;
  };

export const createGoldenG2VueProjectedBundle =
  (): GoldenGeneratedProjectBundle => {
    const snapshot = createGoldenG2VueExecutableSnapshot();
    return Object.freeze({
      files: projectExecutableProjectRuntimeFiles(snapshot, 'preview'),
    });
  };
