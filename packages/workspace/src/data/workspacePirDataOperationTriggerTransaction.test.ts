import { describe, expect, it } from 'vitest';
import type { DataSourceDocument } from '@prodivix/data';
import type { PIRDocument } from '@prodivix/pir';
import {
  applyWorkspaceTransaction,
  type WorkspaceTransactionEnvelope,
} from '../workspaceCommand';
import type { WorkspaceSnapshot } from '../types';
import {
  WORKSPACE_PIR_DATA_BINDING_PLAN_ISSUE_CODES,
  createWorkspacePirDataOperationBindingTransactionPlan,
  createWorkspacePirDataOperationTriggerTransactionPlan,
} from './workspacePirDataOperationBindingTransaction';

const page = (): PIRDocument => ({
  logic: {
    state: { filter: { initial: '' } },
  },
  ui: {
    graph: {
      rootId: 'root',
      nodesById: {
        root: { id: 'root', kind: 'element', type: 'main' },
        button: {
          id: 'button',
          kind: 'element',
          type: 'button',
          events: {
            onFocus: { kind: 'navigate-route', routeId: 'products' },
          },
        },
      },
      childIdsById: { root: ['button'], button: [] },
    },
  },
});

const dataSource = (): DataSourceDocument => ({
  source: {
    id: 'catalog-source',
    adapterId: 'rest',
    runtimeZone: 'server',
    bindingsById: {},
    configurationByKey: {},
  },
  schemasById: {
    output: {
      id: 'output',
      schema: {
        $schema: 'https://json-schema.org/draft/2020-12/schema',
      },
    },
  },
  operationsById: {
    list: {
      id: 'list',
      kind: 'query',
      outputSchemaId: 'output',
      configurationByKey: {},
      policies: {},
    },
    remove: {
      id: 'remove',
      kind: 'mutation',
      outputSchemaId: 'output',
      configurationByKey: {},
      policies: {},
    },
  },
});

const workspace = (): WorkspaceSnapshot => ({
  id: 'workspace-data-trigger',
  workspaceRev: 4,
  routeRev: 1,
  opSeq: 2,
  treeRootId: 'root-node',
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
      name: 'page.pir.json',
      parentId: 'root-node',
      docId: 'page',
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
    page: {
      id: 'page',
      type: 'pir-page',
      path: '/page.pir.json',
      contentRev: 1,
      metaRev: 1,
      content: page(),
    },
    catalog: {
      id: 'catalog',
      type: 'data-source',
      path: '/catalog.data.json',
      contentRev: 1,
      metaRev: 1,
      content: dataSource(),
    },
  },
  routeManifest: { version: '1', root: { id: 'route-root' } },
});

describe('Workspace PIR Data trigger transaction', () => {
  it('atomically persists a normalized query input and activation contract', () => {
    const source = workspace();
    const plan = createWorkspacePirDataOperationBindingTransactionPlan({
      workspace: source,
      baseRevision: source.workspaceRev,
      transactionId: 'bind-query-input',
      issuedAt: '2026-07-17T00:00:00.000Z',
      documentId: 'page',
      dataId: 'products',
      binding: {
        operation: { documentId: 'catalog', operationId: 'list' },
        input: {
          kind: 'object',
          propertiesByKey: {
            query: { kind: 'runtime-value', valueId: 'symbol:filter' },
          },
        },
        activations: [
          { kind: 'input-change', dependencyId: 'symbol:filter' },
          { kind: 'document' },
        ],
      },
    });
    expect(plan.status).toBe('ready');
    if (plan.status !== 'ready') return;
    expect(plan.plan.nextDocumentContent.logic?.dataById?.products).toEqual({
      operation: { documentId: 'catalog', operationId: 'list' },
      input: {
        kind: 'object',
        propertiesByKey: {
          query: { kind: 'runtime-value', valueId: 'symbol:filter' },
        },
      },
      activations: [
        { kind: 'document' },
        { kind: 'input-change', dependencyId: 'symbol:filter' },
      ],
    });
  });

  it('writes, renames, and reverses one explicit mutation event', () => {
    const source = workspace();
    const plan = createWorkspacePirDataOperationTriggerTransactionPlan({
      workspace: source,
      baseRevision: source.workspaceRev,
      transactionId: 'bind-mutation',
      issuedAt: '2026-07-17T00:00:00.000Z',
      documentId: 'page',
      nodeId: 'button',
      previousEventName: 'onFocus',
      eventName: 'onClick',
      replaceExisting: true,
      trigger: {
        kind: 'dispatch-data-operation',
        operation: { documentId: 'catalog', operationId: 'remove' },
        input: { kind: 'trigger-payload', path: '/id' },
      },
    });
    expect(plan.status).toBe('ready');
    if (plan.status !== 'ready') return;
    const applied = applyWorkspaceTransaction(source, plan.plan.transaction);
    expect(applied.ok).toBe(true);
    if (!applied.ok) return;
    expect(
      (applied.snapshot.docsById.page.content as PIRDocument).ui.graph.nodesById
        .button
    ).toMatchObject({
      events: {
        onClick: {
          kind: 'dispatch-data-operation',
          operation: { documentId: 'catalog', operationId: 'remove' },
          input: { kind: 'trigger-payload', path: '/id' },
        },
      },
    });
    const command = plan.plan.command;
    const reverse: WorkspaceTransactionEnvelope = {
      id: 'reverse-mutation-binding',
      workspaceId: source.id,
      issuedAt: '2026-07-17T00:01:00.000Z',
      commands: [
        {
          ...command,
          id: 'reverse-mutation-binding:document',
          issuedAt: '2026-07-17T00:01:00.000Z',
          forwardOps: command.reverseOps,
          reverseOps: command.forwardOps,
        },
      ],
    };
    const reversed = applyWorkspaceTransaction(applied.snapshot, reverse);
    expect(reversed.ok).toBe(true);
    if (reversed.ok) {
      expect(reversed.snapshot.docsById.page.content).toEqual(
        source.docsById.page.content
      );
    }
  });

  it('rejects query operations and implicit replacement of another event owner', () => {
    const source = workspace();
    const query = createWorkspacePirDataOperationTriggerTransactionPlan({
      workspace: source,
      baseRevision: source.workspaceRev,
      transactionId: 'bind-query-as-mutation',
      issuedAt: '2026-07-17T00:00:00.000Z',
      documentId: 'page',
      nodeId: 'button',
      eventName: 'onClick',
      trigger: {
        kind: 'dispatch-data-operation',
        operation: { documentId: 'catalog', operationId: 'list' },
        input: { kind: 'literal', value: null },
      },
    });
    expect(query.status).toBe('rejected');
    if (query.status === 'rejected')
      expect(query.issues.map(({ code }) => code)).toContain(
        WORKSPACE_PIR_DATA_BINDING_PLAN_ISSUE_CODES.operationKindInvalid
      );

    const conflict = createWorkspacePirDataOperationTriggerTransactionPlan({
      workspace: source,
      baseRevision: source.workspaceRev,
      transactionId: 'overwrite-navigation',
      issuedAt: '2026-07-17T00:00:00.000Z',
      documentId: 'page',
      nodeId: 'button',
      eventName: 'onFocus',
      trigger: {
        kind: 'dispatch-data-operation',
        operation: { documentId: 'catalog', operationId: 'remove' },
        input: { kind: 'literal', value: null },
      },
    });
    expect(conflict.status).toBe('rejected');
    if (conflict.status === 'rejected')
      expect(conflict.issues.map(({ code }) => code)).toContain(
        WORKSPACE_PIR_DATA_BINDING_PLAN_ISSUE_CODES.triggerConflict
      );
  });
});
