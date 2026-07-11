import { beforeEach, describe, expect, it } from 'vitest';
import { createDefaultPirDoc } from '@prodivix/pir';
import type {
  DecodedWorkspaceMutation,
  WorkspaceCommandEnvelope,
  WorkspaceSnapshot,
  WorkspaceTransactionEnvelope,
} from '@prodivix/workspace';
import { useEditorStore } from '@/editor/store/useEditorStore';

const createEditorWorkspace = (): WorkspaceSnapshot => ({
  id: 'workspace-test',
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
      children: ['pages'],
    },
    pages: {
      id: 'pages',
      kind: 'dir',
      name: 'pages',
      parentId: 'root',
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
      contentRev: 1,
      metaRev: 1,
      content: createDefaultPirDoc(),
    },
  },
  routeManifest: {
    version: '1',
    root: {
      id: 'root-route',
      children: [{ id: 'route-home', index: true, pageDocId: 'page-home' }],
    },
  },
  activeDocumentId: 'page-home',
  activeRouteNodeId: 'route-home',
});

const resetEditorStore = () => {
  const state = useEditorStore.getState();
  useEditorStore.setState(
    {
      ...state,
      workspace: null,
      documentEditSeqById: {},
      workspaceCapabilities: {},
      workspaceCapabilitiesLoaded: false,
      workspaceReadonly: false,
      blueprintStateByProject: {},
      runtimeStateByProject: {},
      projectsById: {},
    },
    true
  );
};

const createMetadataCommand = (
  overrides: Partial<WorkspaceCommandEnvelope> = {}
): WorkspaceCommandEnvelope => ({
  id: 'command-metadata',
  namespace: 'core.pir',
  type: 'metadata.update',
  version: '1.0',
  issuedAt: '2026-07-12T00:00:00.000Z',
  target: {
    workspaceId: 'workspace-test',
    documentId: 'page-home',
  },
  domainHint: 'pir',
  forwardOps: [{ op: 'add', path: '/metadata', value: { name: 'One' } }],
  reverseOps: [{ op: 'remove', path: '/metadata' }],
  ...overrides,
});

beforeEach(() => resetEditorStore());

describe('editor workspace store hard cut', () => {
  it('hydrates only the canonical workspace and resets local edit sequences', () => {
    const workspace = createEditorWorkspace();
    useEditorStore.getState().setWorkspaceSnapshot(workspace);
    useEditorStore.getState().dispatchWorkspaceCommand(createMetadataCommand());
    expect(useEditorStore.getState().documentEditSeqById['page-home']).toBe(1);

    useEditorStore.getState().setWorkspaceSnapshot(workspace);
    const state = useEditorStore.getState();
    expect(state.workspace).toBe(workspace);
    expect(state.documentEditSeqById).toEqual({});
    expect('pirDoc' in state).toBe(false);
    expect('workspaceDocumentsById' in state).toBe(false);
    expect('routeManifest' in state).toBe(false);
  });

  it('updates the active PIR through a command without advancing server revisions', () => {
    const workspace = createEditorWorkspace();
    useEditorStore.getState().setWorkspaceSnapshot(workspace);

    const result = useEditorStore
      .getState()
      .updateActivePirDocument(
        (document) => ({ ...document, metadata: { name: 'Edited' } }),
        { commandId: 'command-active-pir', mergeKey: 'metadata:name' }
      );

    expect(result?.ok).toBe(true);
    const state = useEditorStore.getState();
    expect(state.workspace?.docsById['page-home'].content).toHaveProperty(
      'metadata.name',
      'Edited'
    );
    expect(state.workspace?.docsById['page-home'].contentRev).toBe(1);
    expect(state.documentEditSeqById['page-home']).toBe(1);
  });

  it('applies mutation acknowledgements without incrementing local edit sequences', () => {
    const workspace = createEditorWorkspace();
    useEditorStore.getState().setWorkspaceSnapshot(workspace);
    useEditorStore.getState().dispatchWorkspaceCommand(createMetadataCommand());
    const editedDocument =
      useEditorStore.getState().workspace?.docsById['page-home'];
    if (!editedDocument) throw new Error('Expected active document.');
    const mutation: DecodedWorkspaceMutation = {
      workspaceId: workspace.id,
      workspaceRev: 2,
      routeRev: 1,
      opSeq: 2,
      updatedDocuments: [{ ...editedDocument, contentRev: 2 }],
      removedDocumentIds: [],
    };

    useEditorStore.getState().applyWorkspaceMutation(mutation);

    const state = useEditorStore.getState();
    expect(state.workspace?.workspaceRev).toBe(2);
    expect(state.workspace?.docsById['page-home'].contentRev).toBe(2);
    expect(state.documentEditSeqById['page-home']).toBe(1);
  });

  it('aligns the authoring document when selecting a route with a page', () => {
    const workspace = createEditorWorkspace();
    const aboutDocument = {
      ...workspace.docsById['page-home'],
      id: 'page-about',
      path: '/pages/about.pir.json',
    };
    const nextWorkspace = {
      ...workspace,
      treeById: {
        ...workspace.treeById,
        pages: {
          ...workspace.treeById.pages,
          children: ['doc-page-home', 'doc-page-about'],
        },
        'doc-page-about': {
          id: 'doc-page-about',
          kind: 'doc' as const,
          name: 'about.pir.json',
          parentId: 'pages',
          docId: 'page-about',
        },
      },
      docsById: {
        ...workspace.docsById,
        'page-about': aboutDocument,
      },
      routeManifest: {
        ...workspace.routeManifest,
        root: {
          ...workspace.routeManifest.root,
          children: [
            ...(workspace.routeManifest.root.children ?? []),
            {
              id: 'route-about',
              segment: 'about',
              pageDocId: 'page-about',
            },
          ],
        },
      },
    };
    useEditorStore.getState().setWorkspaceSnapshot(nextWorkspace);

    useEditorStore.getState().setActiveRouteNodeId('route-about');

    expect(useEditorStore.getState().workspace).toMatchObject({
      activeRouteNodeId: 'route-about',
      activeDocumentId: 'page-about',
    });
  });

  it('dispatches route intents against the canonical workspace', () => {
    useEditorStore.getState().setWorkspaceSnapshot(createEditorWorkspace());

    const result = useEditorStore.getState().applyRouteIntent({
      type: 'create-child-route',
      parentRouteNodeId: 'route-home',
      segment: 'details',
      routeNodeId: 'route-details',
      pageDocId: 'page-details',
    });

    expect(result?.ok).toBe(true);
    const workspace = useEditorStore.getState().workspace;
    expect(workspace?.docsById['page-details']).toBeDefined();
    expect(workspace).toMatchObject({
      activeRouteNodeId: 'route-details',
      activeDocumentId: 'page-details',
    });
  });

  it('counts a multi-command document transaction as one local edit', () => {
    useEditorStore.getState().setWorkspaceSnapshot(createEditorWorkspace());
    const transaction: WorkspaceTransactionEnvelope = {
      id: 'transaction-metadata',
      workspaceId: 'workspace-test',
      issuedAt: '2026-07-12T00:00:00.000Z',
      commands: [
        createMetadataCommand({ id: 'command-metadata-add' }),
        createMetadataCommand({
          id: 'command-metadata-replace',
          forwardOps: [{ op: 'replace', path: '/metadata/name', value: 'Two' }],
          reverseOps: [{ op: 'replace', path: '/metadata/name', value: 'One' }],
        }),
      ],
    };

    const result = useEditorStore
      .getState()
      .dispatchWorkspaceTransaction(transaction);

    expect(result?.ok).toBe(true);
    expect(useEditorStore.getState().documentEditSeqById['page-home']).toBe(1);
    expect(
      useEditorStore.getState().workspace?.docsById['page-home'].content
    ).toHaveProperty('metadata.name', 'Two');
  });
});
