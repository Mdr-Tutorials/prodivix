import { describe, expect, it } from 'vitest';
import { createEmptyPirDocument } from '@prodivix/pir';
import type { WorkspaceSnapshot } from '@prodivix/workspace';
import { generateWorkspaceReactViteExecutableProject } from '#src/executableProject/workspaceExecutableProject';
import { compileWorkspaceToExportProgram } from './workspaceProject';

const workspace: WorkspaceSnapshot = {
  id: 'standalone-domain-export',
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
      children: ['page-node', 'graph-node', 'animation-node'],
    },
    'page-node': {
      id: 'page-node',
      kind: 'doc',
      name: 'page.pir.json',
      parentId: 'root',
      docId: 'page',
    },
    'graph-node': {
      id: 'graph-node',
      kind: 'doc',
      name: 'main.pir-graph.json',
      parentId: 'root',
      docId: 'graph-main',
    },
    'animation-node': {
      id: 'animation-node',
      kind: 'doc',
      name: 'main.pir-animation.json',
      parentId: 'root',
      docId: 'animation-main',
    },
  },
  docsById: {
    page: {
      id: 'page',
      type: 'pir-page',
      path: '/page.pir.json',
      contentRev: 1,
      metaRev: 1,
      content: createEmptyPirDocument(),
    },
    'graph-main': {
      id: 'graph-main',
      type: 'pir-graph',
      path: '/main.pir-graph.json',
      contentRev: 1,
      metaRev: 1,
      content: {
        version: 1,
        nodes: [{ id: 'start', data: { kind: 'start' } }],
        edges: [],
      },
    },
    'animation-main': {
      id: 'animation-main',
      type: 'pir-animation',
      path: '/main.pir-animation.json',
      contentRev: 1,
      metaRev: 1,
      content: {
        version: 1,
        target: { kind: 'pir-document', documentId: 'page' },
        timelines: [
          {
            id: 'timeline-main',
            name: 'Main',
            durationMs: 300,
            bindings: [],
          },
        ],
      },
    },
  },
  routeManifest: {
    version: '1',
    root: { id: 'route-root', pageDocId: 'page' },
  },
};

describe('standalone domain export conformance', () => {
  it('compiles NodeGraph and Animation documents into the Workspace program', () => {
    const program = compileWorkspaceToExportProgram(workspace);

    expect(program.modules.map(({ id }) => id)).toEqual(
      expect.arrayContaining([
        'nodegraph:graph-main',
        'animation:animation-main:timeline-main',
      ])
    );
    expect(program.diagnostics).not.toContainEqual(
      expect.objectContaining({ code: 'WKS-EXPORT-DOCUMENT-UNSUPPORTED' })
    );
  });

  it('produces the provider-neutral executable project from the exact revision', () => {
    const result = generateWorkspaceReactViteExecutableProject(workspace);

    expect(result.status).toBe('ready');
    if (result.status !== 'ready') return;
    expect(result.snapshot).toMatchObject({
      format: 'prodivix.executable-project.v1',
      workspace: {
        workspaceId: workspace.id,
        snapshotId: expect.stringContaining(`${workspace.id}|w=1|r=1|o=1`),
      },
      target: {
        presetId: 'react-vite',
        framework: 'react',
        runtime: 'vite',
      },
      buildCommand: {
        command: 'corepack',
        args: ['pnpm', 'run', 'build'],
      },
    });
    expect(result.snapshot.contentDigest).toMatch(/^sha256-[a-f0-9]{64}$/u);
    expect(result.snapshot.dependencyPlan).toMatchObject({
      manifestFilePath: 'package.json',
      installFingerprint: expect.stringMatching(/^sha256-[a-f0-9]{64}$/u),
    });
    expect(result.snapshot.entrypoints).toEqual([
      { kind: 'build', path: 'index.html' },
      { kind: 'preview', path: 'index.html' },
      { kind: 'test', path: 'src/App.test.tsx' },
    ]);
    expect(result.snapshot.capabilityRequirements.test).toContain('test');
    expect(result.snapshot.publicBuildConfiguration).toEqual([]);
    expect(
      result.snapshot.files.some((file) => file.path === 'package.json')
    ).toBe(true);
  });
});
