import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import type {
  PIRCollectionNode,
  PIRDataOperationBinding,
  PIRDocument,
} from '@prodivix/pir';
import type { DataSourceDocument } from '@prodivix/data';
import {
  applyWorkspaceTransaction,
  type WorkspaceTransactionEnvelope,
} from '../workspaceCommand';
import type { WorkspaceSnapshot } from '../types';
import {
  WORKSPACE_PIR_DATA_BINDING_PLAN_ISSUE_CODES,
  createWorkspaceCollectionDataOperationBindingTransactionPlan,
  createWorkspacePirDataOperationBindingTransactionPlan,
} from './workspacePirDataOperationBindingTransaction';

const propertyParameters = Object.freeze({
  numRuns: 20,
  seed: 0x15_07_2026,
});

const createPage = (): PIRDocument => ({
  ui: {
    graph: {
      rootId: 'root',
      nodesById: {
        root: { id: 'root', kind: 'element', type: 'main' },
        products: {
          id: 'products',
          kind: 'collection',
          source: { kind: 'literal', value: [] },
          key: { kind: 'index' },
          symbols: {
            itemId: 'product-item',
            itemName: 'product',
            indexId: 'product-index',
            indexName: 'index',
            errorId: 'product-error',
          },
        },
        'product-row': { id: 'product-row', kind: 'element', type: 'article' },
      },
      childIdsById: {
        root: ['products'],
        products: [],
        'product-row': [],
      },
      regionsById: {
        products: { item: ['product-row'], empty: [], loading: [], error: [] },
      },
      order: { strategy: 'childIdsById' },
    },
  },
});

const createDataSource = (): DataSourceDocument => ({
  source: {
    id: 'catalog-source',
    adapterId: 'rest',
    runtimeZone: 'server',
    bindingsById: {},
    configurationByKey: {},
  },
  schemasById: {
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
    'delete-product': {
      id: 'delete-product',
      kind: 'mutation',
      outputSchemaId: 'products',
      configurationByKey: {},
      policies: {},
    },
  },
});

const createWorkspace = (): WorkspaceSnapshot => ({
  id: 'workspace-data-binding',
  workspaceRev: 7,
  routeRev: 1,
  opSeq: 3,
  treeRootId: 'root-node',
  activeDocumentId: 'page-home',
  treeById: {
    'root-node': {
      id: 'root-node',
      kind: 'dir',
      name: '/',
      parentId: null,
      children: ['page-node', 'data-node'],
    },
    'page-node': {
      id: 'page-node',
      kind: 'doc',
      name: 'home.pir.json',
      parentId: 'root-node',
      docId: 'page-home',
    },
    'data-node': {
      id: 'data-node',
      kind: 'doc',
      name: 'catalog.data.json',
      parentId: 'root-node',
      docId: 'catalog',
    },
  },
  docsById: {
    'page-home': {
      id: 'page-home',
      type: 'pir-page',
      path: '/home.pir.json',
      contentRev: 1,
      metaRev: 1,
      content: createPage(),
    },
    catalog: {
      id: 'catalog',
      type: 'data-source',
      path: '/catalog.data.json',
      contentRev: 1,
      metaRev: 1,
      content: createDataSource(),
    },
  },
  routeManifest: { version: '1', root: { id: 'route-root' } },
});

describe('Workspace PIR Data operation binding planner properties', () => {
  it('atomically binds a Collection and reverses to the exact baseline', () => {
    fc.assert(
      fc.property(
        fc.stringMatching(/^[a-z][a-z0-9-]{0,10}$/),
        fc.option(fc.stringMatching(/^[a-z][a-z0-9.]{0,10}$/), {
          nil: undefined,
        }),
        (dataId, path) => {
          fc.pre(dataId !== 'root' && dataId !== 'product-row');
          const workspace = createWorkspace();
          const baseline = workspace.docsById['page-home'].content;
          const result =
            createWorkspaceCollectionDataOperationBindingTransactionPlan({
              workspace,
              baseRevision: workspace.workspaceRev,
              transactionId: `bind-${dataId}`,
              issuedAt: '2026-07-15T00:00:00.000Z',
              documentId: 'page-home',
              collectionNodeId: 'products',
              dataId,
              operation: {
                documentId: 'catalog',
                operationId: 'list-products',
              },
              idle: 'loading',
              ...(path ? { path: ` ${path} ` } : {}),
            });
          expect(result.status).toBe('ready');
          if (result.status !== 'ready') return;

          const applied = applyWorkspaceTransaction(
            workspace,
            result.plan.transaction
          );
          expect(applied.ok).toBe(true);
          if (!applied.ok) return;
          const content = applied.snapshot.docsById['page-home']
            .content as PIRDocument;
          expect(content.logic?.dataById?.[dataId]).toEqual({
            operation: {
              documentId: 'catalog',
              operationId: 'list-products',
            },
          });
          const collection = content.ui.graph.nodesById[
            'products'
          ] as PIRCollectionNode;
          expect(collection.lifecycle).toEqual({
            kind: 'data-operation',
            dataId,
            idle: 'loading',
          });
          expect(collection.source).toEqual({
            kind: 'binding',
            value: {
              kind: 'data',
              dataId,
              ...(path ? { path } : {}),
            },
          });

          const command = result.plan.command;
          const reverse: WorkspaceTransactionEnvelope = {
            id: `reverse-${dataId}`,
            workspaceId: workspace.id,
            issuedAt: '2026-07-15T00:01:00.000Z',
            commands: [
              {
                ...command,
                id: `reverse-${dataId}:document`,
                issuedAt: '2026-07-15T00:01:00.000Z',
                forwardOps: command.reverseOps,
                reverseOps: command.forwardOps,
              },
            ],
          };
          const reversed = applyWorkspaceTransaction(applied.snapshot, reverse);
          expect(reversed.ok).toBe(true);
          if (reversed.ok) {
            expect(reversed.snapshot.docsById['page-home'].content).toEqual(
              baseline
            );
          }
        }
      ),
      propertyParameters
    );
  });

  it('rejects missing and mutation operations and referenced removal', () => {
    const workspace = createWorkspace();
    const missing = createWorkspacePirDataOperationBindingTransactionPlan({
      workspace,
      baseRevision: workspace.workspaceRev,
      transactionId: 'bind-missing',
      issuedAt: '2026-07-15T00:00:00.000Z',
      documentId: 'page-home',
      dataId: 'products-data',
      binding: {
        operation: { documentId: 'catalog', operationId: 'missing' },
      } satisfies PIRDataOperationBinding,
    });
    expect(missing.status).toBe('rejected');
    if (missing.status === 'rejected') {
      expect(missing.issues.map((issue) => issue.code)).toContain(
        WORKSPACE_PIR_DATA_BINDING_PLAN_ISSUE_CODES.operationMissing
      );
    }

    const mutation =
      createWorkspaceCollectionDataOperationBindingTransactionPlan({
        workspace,
        baseRevision: workspace.workspaceRev,
        transactionId: 'bind-mutation',
        issuedAt: '2026-07-15T00:00:00.000Z',
        documentId: 'page-home',
        collectionNodeId: 'products',
        dataId: 'products-data',
        operation: {
          documentId: 'catalog',
          operationId: 'delete-product',
        },
        idle: 'empty',
      });
    expect(mutation.status).toBe('rejected');
    if (mutation.status === 'rejected') {
      expect(mutation.issues.map((issue) => issue.code)).toContain(
        WORKSPACE_PIR_DATA_BINDING_PLAN_ISSUE_CODES.operationKindInvalid
      );
    }

    const bound = createWorkspaceCollectionDataOperationBindingTransactionPlan({
      workspace,
      baseRevision: workspace.workspaceRev,
      transactionId: 'bind-query',
      issuedAt: '2026-07-15T00:00:00.000Z',
      documentId: 'page-home',
      collectionNodeId: 'products',
      dataId: 'products-data',
      operation: {
        documentId: 'catalog',
        operationId: 'list-products',
      },
      idle: 'loading',
    });
    expect(bound.status).toBe('ready');
    if (bound.status !== 'ready') return;
    const applied = applyWorkspaceTransaction(
      workspace,
      bound.plan.transaction
    );
    expect(applied.ok).toBe(true);
    if (!applied.ok) return;
    const removal = createWorkspacePirDataOperationBindingTransactionPlan({
      workspace: applied.snapshot,
      baseRevision: applied.snapshot.workspaceRev,
      transactionId: 'remove-query',
      issuedAt: '2026-07-15T00:02:00.000Z',
      documentId: 'page-home',
      dataId: 'products-data',
      binding: null,
    });
    expect(removal.status).toBe('rejected');
    if (removal.status === 'rejected') {
      expect(
        removal.issues.every(
          (issue) =>
            issue.code ===
            WORKSPACE_PIR_DATA_BINDING_PLAN_ISSUE_CODES.bindingReferenced
        )
      ).toBe(true);
    }
  });
});
