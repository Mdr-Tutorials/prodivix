import { describe, expect, it } from 'vitest';
import { createDefaultPirDoc } from '@prodivix/pir';
import {
  WorkspaceCodecError,
  applyWorkspaceMutation,
  decodeWorkspaceMutation,
  decodeWorkspaceSnapshot,
  encodeWorkspaceSnapshot,
  type WorkspaceSnapshotWireDto,
} from '..';

const createWireSnapshot = (): WorkspaceSnapshotWireDto => ({
  id: 'workspace-1',
  workspaceRev: 3,
  routeRev: 2,
  opSeq: 7,
  tree: {
    treeRootId: 'root',
    treeById: {
      root: {
        id: 'root',
        kind: 'dir',
        name: '/',
        parentId: null,
        children: ['root-document'],
      },
      'root-document': {
        id: 'root-document',
        kind: 'doc',
        name: 'pir.json',
        parentId: 'root',
        docId: 'page-root',
      },
    },
  },
  documents: [
    {
      id: 'page-root',
      type: 'pir-page',
      path: '/pir.json',
      contentRev: 4,
      metaRev: 1,
      content: createDefaultPirDoc(),
    },
  ],
  routeManifest: {
    version: '1',
    root: {
      id: 'route-root',
      children: [
        {
          id: 'route-home',
          index: true,
          pageDocId: 'page-root',
        },
      ],
    },
  },
  settings: { global: { eventTriggerMode: 'selected-only' } },
  activeRouteNodeId: 'route-home',
});

describe('workspace wire codec', () => {
  it('strictly decodes the Go wire shape into the canonical snapshot', () => {
    const decoded = decodeWorkspaceSnapshot(createWireSnapshot());

    expect(decoded.workspace).toMatchObject({
      id: 'workspace-1',
      treeRootId: 'root',
      activeDocumentId: 'page-root',
      activeRouteNodeId: 'route-home',
    });
    expect(Object.keys(decoded.workspace.docsById)).toEqual(['page-root']);
    expect(decoded.settings).toEqual({
      global: { eventTriggerMode: 'selected-only' },
    });
  });

  it('encodes documents in stable path and id order', () => {
    const decoded = decodeWorkspaceSnapshot(createWireSnapshot());
    const workspace = decoded.workspace;
    workspace.treeById.root.children = ['source', 'root-document'];
    workspace.treeById.source = {
      id: 'source',
      kind: 'dir',
      name: 'src',
      parentId: 'root',
      children: ['source-document'],
    };
    workspace.treeById['source-document'] = {
      id: 'source-document',
      kind: 'doc',
      name: 'index.ts',
      parentId: 'source',
      docId: 'code-index',
    };
    workspace.docsById['code-index'] = {
      id: 'code-index',
      type: 'code',
      path: '/src/index.ts',
      contentRev: 1,
      metaRev: 1,
      content: { language: 'ts', source: 'export const value = 1;' },
    };

    const encoded = encodeWorkspaceSnapshot(workspace, decoded.settings);

    expect(encoded.documents.map((document) => document.id)).toEqual([
      'page-root',
      'code-index',
    ]);
    expect(encoded.tree).toEqual({
      treeRootId: workspace.treeRootId,
      treeById: workspace.treeById,
    });
  });

  it('rejects duplicate document ids instead of silently overwriting', () => {
    const wire = createWireSnapshot();
    wire.documents.push({ ...wire.documents[0] });

    expect(() => decodeWorkspaceSnapshot(wire)).toThrowError(
      WorkspaceCodecError
    );
  });

  it('rejects a damaged VFS instead of synthesizing a fallback tree', () => {
    const wire = createWireSnapshot();
    wire.tree.treeRootId = 'missing-root';

    expect(() => decodeWorkspaceSnapshot(wire)).toThrow(/WKS_ROOT_MISSING/);
  });

  it('rejects invalid code wrappers and missing route documents', () => {
    const invalidCode = createWireSnapshot();
    invalidCode.documents[0] = {
      ...invalidCode.documents[0],
      type: 'code',
      content: 'export default 1',
    };
    expect(() => decodeWorkspaceSnapshot(invalidCode)).toThrow(
      /code content wrapper/
    );

    const invalidRoute = createWireSnapshot();
    const root = invalidRoute.routeManifest as {
      root: { children: Array<{ pageDocId: string }> };
    };
    root.root.children[0].pageDocId = 'missing-page';
    expect(() => decodeWorkspaceSnapshot(invalidRoute)).toThrow(/RTE-2001/);
  });

  it('applies server mutations as the sole owner of confirmed revisions', () => {
    const { workspace } = decodeWorkspaceSnapshot(createWireSnapshot());
    const nextPir = createDefaultPirDoc();
    nextPir.metadata = { name: 'Confirmed' };
    const mutation = decodeWorkspaceMutation(
      {
        workspaceId: workspace.id,
        workspaceRev: 4,
        routeRev: 2,
        opSeq: 8,
        updatedDocuments: [
          {
            ...workspace.docsById['page-root'],
            contentRev: 5,
            content: nextPir,
          },
        ],
      },
      workspace
    );

    const nextWorkspace = applyWorkspaceMutation(workspace, mutation);

    expect(nextWorkspace.workspaceRev).toBe(4);
    expect(nextWorkspace.opSeq).toBe(8);
    expect(nextWorkspace.docsById['page-root'].contentRev).toBe(5);
    expect(nextWorkspace.docsById['page-root'].content).toHaveProperty(
      'metadata.name',
      'Confirmed'
    );
  });

  it('rejects mutations for another workspace', () => {
    const { workspace } = decodeWorkspaceSnapshot(createWireSnapshot());

    expect(() =>
      decodeWorkspaceMutation(
        {
          workspaceId: 'workspace-2',
          workspaceRev: 4,
          routeRev: 2,
          opSeq: 8,
        },
        workspace
      )
    ).toThrow(/does not match/);
  });
});
