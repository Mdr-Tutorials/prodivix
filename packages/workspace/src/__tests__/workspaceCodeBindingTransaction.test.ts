import { describe, expect, it } from 'vitest';
import { createDefaultPirDoc } from '@prodivix/pir';
import type { WorkspaceSnapshot, WorkspaceTransactionEnvelope } from '../index';
import {
  applyWorkspaceTransaction,
  createWorkspaceCodeBindingTransaction,
  selectActivePirWorkspaceDocument,
} from '../index';

const createWorkspace = (): WorkspaceSnapshot => {
  const content = createDefaultPirDoc();
  return {
    id: 'workspace-code-binding',
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
        children: ['page-node'],
      },
      'page-node': {
        id: 'page-node',
        kind: 'doc',
        name: 'home.pir.json',
        parentId: 'root',
        docId: 'page-home',
      },
    },
    docsById: {
      'page-home': {
        id: 'page-home',
        type: 'pir-page',
        path: '/home.pir.json',
        contentRev: 1,
        metaRev: 1,
        content,
      },
    },
    routeManifest: {
      version: '1',
      root: { id: 'route-root', pageDocId: 'page-home' },
    },
    activeDocumentId: 'page-home',
    activeRouteNodeId: 'route-root',
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

describe('createWorkspaceCodeBindingTransaction', () => {
  it('creates missing VFS directories and binds the owner graph atomically', () => {
    const workspace = createWorkspace();
    const ownerDocument = selectActivePirWorkspaceDocument(workspace);
    if (!ownerDocument) throw new Error('Expected an active PIR document.');
    const rootId = ownerDocument.content.ui.graph.rootId;
    const root = ownerDocument.content.ui.graph.nodesById[rootId];
    const afterGraph = {
      ...ownerDocument.content.ui.graph,
      nodesById: {
        ...ownerDocument.content.ui.graph.nodesById,
        [rootId]: {
          ...root,
          props: {
            ...(root.props ?? {}),
            codeBindings: {
              mountedCss: [
                {
                  slotId: 'blueprint.node.root.mountedCss',
                  reference: { artifactId: 'mounted-css' },
                },
              ],
            },
          },
        },
      },
    };
    const transaction = createWorkspaceCodeBindingTransaction({
      workspace,
      ownerDocument,
      codeDocument: {
        id: 'mounted-css',
        type: 'code',
        path: '/styles/mounted/root.css',
        contentRev: 1,
        metaRev: 1,
        content: { language: 'css', source: '.root {}' },
      },
      afterGraph,
      transactionId: 'transaction-code-binding',
      issuedAt: '2026-07-12T00:00:00.000Z',
    });
    if (!transaction) throw new Error('Expected a transaction.');

    const applied = applyWorkspaceTransaction(workspace, transaction);
    expect(applied.ok).toBe(true);
    if (!applied.ok) return;
    expect(applied.snapshot.docsById['mounted-css']?.path).toBe(
      '/styles/mounted/root.css'
    );
    expect(
      Object.values(applied.snapshot.treeById).map((node) => node.name)
    ).toEqual(expect.arrayContaining(['styles', 'mounted', 'root.css']));
    expect(applied.snapshot.docsById['page-home']?.content).toHaveProperty(
      'ui.graph',
      afterGraph
    );

    const undone = applyWorkspaceTransaction(
      applied.snapshot,
      reverseTransaction(transaction)
    );
    expect(undone).toMatchObject({ ok: true, snapshot: workspace });
  });

  it('rejects stale owners and non-code documents', () => {
    const workspace = createWorkspace();
    const ownerDocument = selectActivePirWorkspaceDocument(workspace);
    if (!ownerDocument) throw new Error('Expected an active PIR document.');
    const afterGraph = { ...ownerDocument.content.ui.graph };
    const input = {
      workspace,
      ownerDocument,
      codeDocument: {
        id: 'mounted-css',
        type: 'code' as const,
        path: '/styles/mounted/root.css',
        contentRev: 1,
        metaRev: 1,
        content: { language: 'css' as const, source: '.root {}' },
      },
      afterGraph,
    };

    expect(
      createWorkspaceCodeBindingTransaction({
        ...input,
        ownerDocument: { ...ownerDocument },
      })
    ).toBeNull();
    expect(
      createWorkspaceCodeBindingTransaction({
        ...input,
        codeDocument: { ...input.codeDocument, type: 'asset' },
      })
    ).toBeNull();
  });
});
