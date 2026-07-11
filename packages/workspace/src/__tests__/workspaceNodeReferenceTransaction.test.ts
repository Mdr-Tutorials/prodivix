import { describe, expect, it } from 'vitest';
import type { PIRDocument } from '@prodivix/shared/types/pir';
import { removeNode, renameNodeId } from '@prodivix/pir';
import {
  applyWorkspaceTransaction,
  createNodeDeleteTransaction,
  createNodeRenameTransaction,
  createNodeSubtreeRemovalTransaction,
  type WorkspacePirDocument,
  type WorkspaceSnapshot,
  type WorkspaceTransactionEnvelope,
} from '..';

const createPirDocument = (): PIRDocument => ({
  version: '1.3',
  ui: {
    graph: {
      version: 1,
      rootId: 'root',
      nodesById: {
        root: { id: 'root', type: 'container' },
        panel: { id: 'panel', type: 'container' },
        child: { id: 'child', type: 'text', text: 'Child' },
        other: { id: 'other', type: 'text', text: 'Other' },
      },
      childIdsById: {
        root: ['panel', 'other'],
        panel: ['child'],
        child: [],
        other: [],
      },
    },
  },
  animation: {
    version: 1,
    timelines: [
      {
        id: 'timeline-main',
        name: 'Main',
        durationMs: 1000,
        bindings: [
          { id: 'binding-panel', targetNodeId: 'panel', tracks: [] },
          { id: 'binding-child', targetNodeId: 'child', tracks: [] },
          { id: 'binding-other', targetNodeId: 'other', tracks: [] },
        ],
      },
    ],
  },
});

const createWorkspace = (): WorkspaceSnapshot => {
  const content = createPirDocument();
  return {
    id: 'workspace-1',
    workspaceRev: 4,
    routeRev: 2,
    opSeq: 8,
    treeRootId: 'root-dir',
    treeById: {
      'root-dir': {
        id: 'root-dir',
        kind: 'dir',
        name: '/',
        parentId: null,
        children: ['pages'],
      },
      pages: {
        id: 'pages',
        kind: 'dir',
        name: 'pages',
        parentId: 'root-dir',
        children: ['doc-page-home'],
      },
      'doc-page-home': {
        id: 'doc-page-home',
        kind: 'doc',
        name: 'home.pir.json',
        parentId: 'pages',
        docId: 'page-home',
      },
    },
    docsById: {
      'page-home': {
        id: 'page-home',
        type: 'pir-page',
        path: '/pages/home.pir.json',
        contentRev: 3,
        metaRev: 1,
        content,
      },
    },
    routeManifest: {
      version: '1',
      root: {
        id: 'route-root',
        children: [
          {
            id: 'route-home',
            index: true,
            pageDocId: 'page-home',
            outletNodeId: 'panel',
            outletBindings: {
              sidebar: { outletNodeId: 'child' },
              stable: { outletNodeId: 'other' },
            },
          },
        ],
      },
      modules: {
        embedded: {
          moduleId: 'embedded',
          version: '1',
          root: { id: 'module-root', outletNodeId: 'panel' },
        },
      },
    },
    activeDocumentId: 'page-home',
    activeRouteNodeId: 'route-home',
  };
};

const getActivePirDocument = (
  workspace: WorkspaceSnapshot
): WorkspacePirDocument =>
  workspace.docsById['page-home'] as WorkspacePirDocument;

const createWorkspaceWithoutAnimation = (): WorkspaceSnapshot => {
  const workspace = createWorkspace();
  const document = getActivePirDocument(workspace);
  const { animation: _animation, ...content } = document.content;
  return {
    ...workspace,
    docsById: {
      ...workspace.docsById,
      [document.id]: { ...document, content },
    },
  };
};

const reverseTransaction = (
  transaction: WorkspaceTransactionEnvelope
): WorkspaceTransactionEnvelope => ({
  ...transaction,
  id: `${transaction.id}:undo`,
  commands: [...transaction.commands].reverse().map((command) => ({
    ...command,
    id: `${command.id}:undo`,
    forwardOps: command.reverseOps,
    reverseOps: command.forwardOps,
  })),
});

describe('node reference transactions', () => {
  it('renames graph, animation, host route, and route-module references atomically', () => {
    const workspace = createWorkspace();
    const document = getActivePirDocument(workspace);
    const afterGraph = renameNodeId(
      document.content.ui.graph,
      'panel',
      'panel-renamed'
    );
    const transaction = createNodeRenameTransaction({
      workspace,
      document,
      afterGraph,
      nodeIdMap: { panel: 'panel-renamed' },
      transactionId: 'transaction-rename',
      issuedAt: '2026-07-12T00:00:00.000Z',
    });

    expect(transaction?.commands).toHaveLength(2);
    if (!transaction) return;
    const applied = applyWorkspaceTransaction(workspace, transaction);
    expect(applied.ok).toBe(true);
    if (!applied.ok) return;

    const content = getActivePirDocument(applied.snapshot).content;
    expect(content.ui.graph.nodesById['panel-renamed']).toBeDefined();
    expect(
      content.animation?.timelines[0].bindings.map(
        (binding) => binding.targetNodeId
      )
    ).toEqual(['panel-renamed', 'child', 'other']);
    expect(applied.snapshot.routeManifest.root.children?.[0].outletNodeId).toBe(
      'panel-renamed'
    );
    expect(
      applied.snapshot.routeManifest.modules?.embedded.root.outletNodeId
    ).toBe('panel-renamed');
    expect(applied.snapshot.docsById['page-home'].contentRev).toBe(3);

    const restored = applyWorkspaceTransaction(
      applied.snapshot,
      reverseTransaction(transaction)
    );
    expect(restored.ok).toBe(true);
    if (!restored.ok) return;
    expect(restored.snapshot).toEqual(workspace);
  });

  it('deletes a subtree and removes every animation and outlet reference', () => {
    const workspace = createWorkspace();
    const document = getActivePirDocument(workspace);
    const afterGraph = removeNode(document.content.ui.graph, 'panel');
    const transaction = createNodeDeleteTransaction({
      workspace,
      document,
      afterGraph,
      removedNodeIds: new Set(['panel', 'child']),
      transactionId: 'transaction-delete',
      issuedAt: '2026-07-12T00:00:00.000Z',
    });

    expect(transaction?.commands).toHaveLength(2);
    if (!transaction) return;
    const applied = applyWorkspaceTransaction(workspace, transaction);
    expect(applied.ok).toBe(true);
    if (!applied.ok) return;

    const content = getActivePirDocument(applied.snapshot).content;
    expect(Object.keys(content.ui.graph.nodesById)).toEqual(['root', 'other']);
    expect(
      content.animation?.timelines[0].bindings.map(
        (binding) => binding.targetNodeId
      )
    ).toEqual(['other']);
    const route = applied.snapshot.routeManifest.root.children?.[0];
    expect(route?.outletNodeId).toBeUndefined();
    expect(route?.outletBindings).toEqual({
      stable: { outletNodeId: 'other' },
    });
    expect(
      applied.snapshot.routeManifest.modules?.embedded.root.outletNodeId
    ).toBeUndefined();

    const restored = applyWorkspaceTransaction(
      applied.snapshot,
      reverseTransaction(transaction)
    );
    expect(restored.ok).toBe(true);
    if (!restored.ok) return;
    expect(restored.snapshot).toEqual(workspace);
  });

  it('cleans references for a descendant removed by a subtree update', () => {
    const workspace = createWorkspace();
    const document = getActivePirDocument(workspace);
    const afterGraph = removeNode(document.content.ui.graph, 'child');
    const transaction = createNodeSubtreeRemovalTransaction({
      workspace,
      document,
      afterGraph,
      removedNodeIds: ['child'],
      transactionId: 'transaction-subtree',
      issuedAt: '2026-07-12T00:00:00.000Z',
    });

    expect(transaction).not.toBeNull();
    if (!transaction) return;
    const applied = applyWorkspaceTransaction(workspace, transaction);
    expect(applied.ok).toBe(true);
    if (!applied.ok) return;
    const content = getActivePirDocument(applied.snapshot).content;
    expect(content.ui.graph.nodesById.panel).toBeDefined();
    expect(content.ui.graph.nodesById.child).toBeUndefined();
    expect(
      content.animation?.timelines[0].bindings.map(
        (binding) => binding.targetNodeId
      )
    ).toEqual(['panel', 'other']);
    expect(
      applied.snapshot.routeManifest.root.children?.[0].outletBindings
    ).toEqual({ stable: { outletNodeId: 'other' } });
  });

  it('renames references when the PIR document has no animation section', () => {
    const workspace = createWorkspaceWithoutAnimation();
    const document = getActivePirDocument(workspace);
    const transaction = createNodeRenameTransaction({
      workspace,
      document,
      afterGraph: renameNodeId(
        document.content.ui.graph,
        'panel',
        'panel-renamed'
      ),
      nodeIdMap: { panel: 'panel-renamed' },
      transactionId: 'transaction-rename-no-animation',
      issuedAt: '2026-07-12T00:00:00.000Z',
    });

    expect(transaction?.commands[0].forwardOps).toHaveLength(1);
    if (!transaction) return;
    const applied = applyWorkspaceTransaction(workspace, transaction);
    expect(applied.ok).toBe(true);
    if (!applied.ok) return;
    expect(
      getActivePirDocument(applied.snapshot).content.animation
    ).toBeUndefined();
    const restored = applyWorkspaceTransaction(
      applied.snapshot,
      reverseTransaction(transaction)
    );
    expect(restored.ok).toBe(true);
    if (!restored.ok) return;
    expect(restored.snapshot).toEqual(workspace);
  });

  it('deletes references when the PIR document has no animation section', () => {
    const workspace = createWorkspaceWithoutAnimation();
    const document = getActivePirDocument(workspace);
    const transaction = createNodeDeleteTransaction({
      workspace,
      document,
      afterGraph: removeNode(document.content.ui.graph, 'panel'),
      removedNodeIds: ['panel', 'child'],
      transactionId: 'transaction-delete-no-animation',
      issuedAt: '2026-07-12T00:00:00.000Z',
    });

    expect(transaction?.commands[0].forwardOps).toHaveLength(1);
    if (!transaction) return;
    const applied = applyWorkspaceTransaction(workspace, transaction);
    expect(applied.ok).toBe(true);
    if (!applied.ok) return;
    expect(
      getActivePirDocument(applied.snapshot).content.animation
    ).toBeUndefined();
    expect(
      applied.snapshot.routeManifest.root.children?.[0].outletBindings
    ).toEqual({ stable: { outletNodeId: 'other' } });
  });

  it('rejects stale plans and exposes no partial state when a command fails', () => {
    const workspace = createWorkspace();
    const document = getActivePirDocument(workspace);
    const afterGraph = renameNodeId(
      document.content.ui.graph,
      'panel',
      'panel-renamed'
    );
    expect(
      createNodeRenameTransaction({
        workspace,
        document,
        afterGraph,
        nodeIdMap: { panel: 'missing-target' },
      })
    ).toBeNull();

    const transaction = createNodeRenameTransaction({
      workspace,
      document,
      afterGraph,
      nodeIdMap: { panel: 'panel-renamed' },
      transactionId: 'transaction-failure',
      issuedAt: '2026-07-12T00:00:00.000Z',
    });
    if (!transaction) throw new Error('Expected a valid transaction.');
    const brokenTransaction: WorkspaceTransactionEnvelope = {
      ...transaction,
      commands: transaction.commands.map((command, index) =>
        index === 1
          ? {
              ...command,
              forwardOps: [
                {
                  op: 'replace',
                  path: '/routeManifest/missing',
                  value: {},
                },
              ],
            }
          : command
      ),
    };
    const before = structuredClone(workspace);
    const failed = applyWorkspaceTransaction(workspace, brokenTransaction);
    expect(failed.ok).toBe(false);
    expect(workspace).toEqual(before);
    expect('snapshot' in failed).toBe(false);
  });
});
