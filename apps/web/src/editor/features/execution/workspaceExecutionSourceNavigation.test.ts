import { afterEach, describe, expect, it } from 'vitest';
import type { WorkspaceSnapshot } from '@prodivix/workspace';
import {
  closeCodeAuthoringOverlay,
  useCodeAuthoringOverlayStore,
} from '@/editor/features/code';
import { createWorkspaceExecutionSnapshotId } from './workspaceExecutionIdentity';
import { openWorkspaceExecutionSourceTrace } from './workspaceExecutionSourceNavigation';

const workspace: WorkspaceSnapshot = {
  id: 'workspace-source-navigation',
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
      children: ['code-node', 'data-node'],
    },
    'code-node': {
      id: 'code-node',
      kind: 'doc',
      name: 'auth.ts',
      parentId: 'root',
      docId: 'code-auth',
    },
    'data-node': {
      id: 'data-node',
      kind: 'doc',
      name: 'catalog.data.json',
      parentId: 'root',
      docId: 'data-catalog',
    },
  },
  docsById: {
    'code-auth': {
      id: 'code-auth',
      type: 'code',
      path: '/auth.ts',
      contentRev: 1,
      metaRev: 1,
      content: {
        language: 'ts',
        source: 'export const loadPrincipal = () => true;\n',
      },
    },
    'data-catalog': {
      id: 'data-catalog',
      type: 'data-source',
      path: '/catalog.data.json',
      contentRev: 1,
      metaRev: 1,
      content: {
        source: {
          id: 'catalog',
          adapterId: 'core.graphql',
          runtimeZone: 'edge',
          bindingsById: {},
          configurationByKey: {},
        },
        schemasById: {
          output: { id: 'output', schema: true },
        },
        operationsById: {
          watch: {
            id: 'watch',
            kind: 'subscription',
            outputSchemaId: 'output',
            configurationByKey: {},
            policies: {},
          },
        },
      },
    },
  },
  routeManifest: {
    version: '1',
    root: { id: 'route-root', pageDocId: 'code-auth' },
  },
};

afterEach(() => closeCodeAuthoringOverlay());

describe('Workspace execution source navigation', () => {
  it('opens the exact CodeArtifact and SourceSpan in the shared authoring overlay', () => {
    const sourceTrace = {
      sourceRef: { kind: 'code-artifact' as const, artifactId: 'code-auth' },
      sourceSpan: {
        artifactId: 'code-auth',
        startLine: 1,
        startColumn: 14,
        endLine: 1,
        endColumn: 27,
      },
    };
    expect(
      openWorkspaceExecutionSourceTrace({
        workspace,
        snapshotId: createWorkspaceExecutionSnapshotId(workspace),
        sourceTrace,
        originSurface: 'blueprint-canvas',
      })
    ).toEqual({ status: 'opened' });
    expect(useCodeAuthoringOverlayStore.getState().request).toMatchObject({
      workspaceId: workspace.id,
      artifactId: 'code-auth',
      sourceSpan: sourceTrace.sourceSpan,
      presentation: 'maximized',
      origin: {
        surface: 'blueprint-canvas',
        targetRef: sourceTrace.sourceRef,
      },
    });
  });

  it('fails closed before navigation when the Workspace snapshot is stale', () => {
    expect(
      openWorkspaceExecutionSourceTrace({
        workspace,
        snapshotId: 'older-snapshot',
        sourceTrace: {
          sourceRef: { kind: 'code-artifact', artifactId: 'code-auth' },
        },
        originSurface: 'blueprint-canvas',
      })
    ).toEqual({ status: 'unavailable', reason: 'snapshot-stale' });
    expect(useCodeAuthoringOverlayStore.getState().request).toBeNull();
  });

  it('opens an exact Data operation owner only after the snapshot fence passes', () => {
    const opened: unknown[] = [];
    const sourceTrace = {
      sourceRef: {
        kind: 'data-operation' as const,
        documentId: 'data-catalog',
        operationId: 'watch',
      },
      label: 'GraphQL subscription',
    };
    expect(
      openWorkspaceExecutionSourceTrace({
        workspace,
        snapshotId: createWorkspaceExecutionSnapshotId(workspace),
        sourceTrace,
        originSurface: 'blueprint-canvas',
        openDataOperation: (target) => {
          opened.push(target);
          return true;
        },
      })
    ).toEqual({ status: 'opened' });
    expect(opened).toEqual([
      { documentId: 'data-catalog', operationId: 'watch' },
    ]);

    expect(
      openWorkspaceExecutionSourceTrace({
        workspace,
        snapshotId: 'stale-snapshot',
        sourceTrace,
        originSurface: 'blueprint-canvas',
        openDataOperation: () => {
          throw new Error('Stale trace must not navigate.');
        },
      })
    ).toEqual({ status: 'unavailable', reason: 'snapshot-stale' });
  });

  it('delegates non-code execution owners only after the same snapshot fence', () => {
    const opened: unknown[] = [];
    const sourceTrace = {
      sourceRef: {
        kind: 'nodegraph-node' as const,
        documentId: 'graph-main',
        nodeId: 'node-request',
      },
    };
    expect(
      openWorkspaceExecutionSourceTrace({
        workspace,
        snapshotId: createWorkspaceExecutionSnapshotId(workspace),
        sourceTrace,
        originSurface: 'nodegraph',
        openSemanticTarget: (trace) => {
          opened.push(trace);
          return true;
        },
      })
    ).toEqual({ status: 'opened' });
    expect(opened).toEqual([sourceTrace]);

    expect(
      openWorkspaceExecutionSourceTrace({
        workspace,
        snapshotId: 'stale-snapshot',
        sourceTrace,
        originSurface: 'nodegraph',
        openSemanticTarget: () => {
          throw new Error('Stale trace must not navigate.');
        },
      })
    ).toEqual({ status: 'unavailable', reason: 'snapshot-stale' });
  });

  it('rejects non-CodeArtifact and unavailable source targets', () => {
    const snapshotId = createWorkspaceExecutionSnapshotId(workspace);
    expect(
      openWorkspaceExecutionSourceTrace({
        workspace,
        snapshotId,
        sourceTrace: {
          sourceRef: { kind: 'workspace', workspaceId: workspace.id },
        },
        originSurface: 'blueprint-canvas',
      })
    ).toEqual({ status: 'unavailable', reason: 'source-unavailable' });
    expect(
      openWorkspaceExecutionSourceTrace({
        workspace,
        snapshotId,
        sourceTrace: {
          sourceRef: { kind: 'code-artifact', artifactId: 'missing-code' },
        },
        originSurface: 'blueprint-canvas',
      })
    ).toEqual({ status: 'unavailable', reason: 'source-unavailable' });
  });
});
