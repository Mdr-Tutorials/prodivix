import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createExecutionTestReport } from '@prodivix/runtime-core';
import type { WorkspaceSnapshot } from '@prodivix/workspace';
import { useCodeAuthoringOverlayStore } from '@/editor/features/code';
import { createWorkspaceExecutionSnapshotId } from '@/editor/features/execution';
import { useEditorStore } from '@/editor/store/useEditorStore';
import ProjectTestingPage from './ProjectTestingPage';

const runnerState = vi.hoisted(() => ({
  current: undefined as unknown,
  setTarget: vi.fn(),
}));

vi.mock('./useProjectTestRunner', () => ({
  useProjectTestRunner: () => runnerState.current,
}));

const workspace: WorkspaceSnapshot = {
  id: 'workspace-tests',
  workspaceRev: 2,
  routeRev: 1,
  opSeq: 2,
  treeRootId: 'root',
  treeById: {
    root: {
      id: 'root',
      kind: 'dir',
      name: '/',
      parentId: null,
      children: ['test-node'],
    },
    'test-node': {
      id: 'test-node',
      kind: 'doc',
      name: 'workspace.test.ts',
      parentId: 'root',
      docId: 'code-test',
    },
  },
  docsById: {
    'code-test': {
      id: 'code-test',
      type: 'code',
      path: '/workspace.test.ts',
      contentRev: 1,
      metaRev: 1,
      content: { language: 'ts', source: 'export const passes = true;\n' },
    },
  },
  routeManifest: { version: '1', root: { id: 'route-root' } },
};

const report = createExecutionTestReport({
  reportId: 'report-source-navigation',
  tool: { name: 'vitest' },
  files: [
    {
      fileId: 'file-source-navigation',
      path: 'workspace.test.ts',
      status: 'passed',
      cases: [
        {
          caseId: 'case-source-navigation',
          name: 'opens exact source',
          status: 'passed',
          sourceTrace: [
            {
              sourceRef: { kind: 'code-artifact', artifactId: 'code-test' },
            },
          ],
        },
      ],
    },
  ],
});

const setRunner = (snapshotId: string) => {
  runnerState.current = Object.freeze({
    sessionId: 'workspace-tests:test:project-tests',
    session: undefined,
    status: 'succeeded',
    report,
    reportSnapshotId: snapshotId,
    reportJobId: 'job-test',
    reportProviderId: 'provider-test',
    diagnostics: Object.freeze([]),
    message: undefined,
    target: 'react-vite',
    setTarget: runnerState.setTarget,
    provider: 'browser',
    setProvider: vi.fn(),
    remoteAvailable: false,
    run: vi.fn(async () => undefined),
    stop: vi.fn(async () => undefined),
  });
};

beforeEach(() => {
  runnerState.setTarget.mockReset();
  act(() => {
    useEditorStore.setState({ workspace, workspaceReadonly: false });
    useCodeAuthoringOverlayStore.getState().close();
  });
});

afterEach(() => {
  act(() => {
    useEditorStore.setState({ workspace: null, workspaceReadonly: false });
    useCodeAuthoringOverlayStore.getState().close();
  });
});

describe('ProjectTestingPage SourceTrace debugger', () => {
  it('lets the user select the Vue/Vite Workspace Test target', () => {
    setRunner(createWorkspaceExecutionSnapshotId(workspace));
    render(
      <MemoryRouter>
        <ProjectTestingPage />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText('testing.target.label'), {
      target: { value: 'vue-vite' },
    });
    expect(runnerState.setTarget).toHaveBeenCalledWith('vue-vite');
  });

  it('opens one exact CodeArtifact from the report-producing snapshot', () => {
    setRunner(createWorkspaceExecutionSnapshotId(workspace));
    render(
      <MemoryRouter>
        <ProjectTestingPage />
      </MemoryRouter>
    );

    fireEvent.click(
      screen.getByRole('button', { name: 'testing.actions.openSource' })
    );
    expect(useCodeAuthoringOverlayStore.getState().request).toMatchObject({
      workspaceId: workspace.id,
      artifactId: 'code-test',
      origin: { surface: 'execution-center' },
    });
  });

  it('keeps an older report visible but fails source navigation closed', () => {
    setRunner('workspace-tests:stale-snapshot');
    render(
      <MemoryRouter>
        <ProjectTestingPage />
      </MemoryRouter>
    );

    fireEvent.click(
      screen.getByRole('button', { name: 'testing.actions.openSource' })
    );
    expect(useCodeAuthoringOverlayStore.getState().request).toBeNull();
    expect(
      screen.getByText('execution.sourceNavigation.snapshotStale')
    ).toBeTruthy();
  });
});
