import { describe, expect, it } from 'vitest';
import { createWorkspaceCodeArtifactProvider } from '..';

describe('createWorkspaceCodeArtifactProvider', () => {
  it('projects workspace code documents into code artifacts', () => {
    const provider = createWorkspaceCodeArtifactProvider({
      id: 'workspace-1',
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
          children: ['src', 'pages'],
        },
        src: {
          id: 'src',
          kind: 'dir',
          name: 'src',
          parentId: 'root',
          children: ['open-dialog-node'],
        },
        'open-dialog-node': {
          id: 'open-dialog-node',
          kind: 'doc',
          name: 'openDialog.ts',
          parentId: 'src',
          docId: 'code-open-dialog',
        },
        pages: {
          id: 'pages',
          kind: 'dir',
          name: 'pages',
          parentId: 'root',
          children: ['home-node'],
        },
        'home-node': {
          id: 'home-node',
          kind: 'doc',
          name: 'home.pir.json',
          parentId: 'pages',
          docId: 'page-home',
        },
      },
      docsById: {
        'code-open-dialog': {
          id: 'code-open-dialog',
          type: 'code',
          path: '/src/actions/openDialog.ts',
          contentRev: 7,
          metaRev: 1,
          content: {
            language: 'ts',
            source: 'export function openDialog() {}',
          },
        },
        'page-home': {
          id: 'page-home',
          type: 'pir-page',
          path: '/pages/home.pir.json',
          contentRev: 1,
          metaRev: 1,
          content: {},
        },
      },
      routeManifest: { version: '1', root: { id: 'route-root' } },
    });

    expect(provider.listArtifacts({ surface: 'code-editor' })).toEqual([
      {
        id: 'code-open-dialog',
        path: '/src/actions/openDialog.ts',
        language: 'ts',
        owner: { kind: 'workspace-module', documentId: 'code-open-dialog' },
        source: 'export function openDialog() {}',
        revision: '7',
      },
    ]);
    expect(provider.getArtifact('code-open-dialog')).toMatchObject({
      id: 'code-open-dialog',
      path: '/src/actions/openDialog.ts',
    });
    expect(provider.getArtifact('missing-code')).toBeNull();
  });
});
