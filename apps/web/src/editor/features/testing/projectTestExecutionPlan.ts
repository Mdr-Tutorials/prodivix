import type { CompileDiagnostic } from '@prodivix/prodivix-compiler';
import type { BrowserProjectSnapshot } from '@prodivix/runtime-browser';
import {
  createExecutionRequest,
  type ExecutionRequest,
} from '@prodivix/runtime-core';
import type { WorkspaceSnapshot } from '@prodivix/workspace';
import {
  createClientExecutionRequestId,
  createWorkspaceBrowserProjectPlan,
} from '@/editor/features/execution';

export type ProjectTestExecutionPlan =
  | Readonly<{
      status: 'ready';
      snapshot: BrowserProjectSnapshot;
      request: ExecutionRequest;
    }>
  | Readonly<{
      status: 'blocked';
      diagnostics: readonly CompileDiagnostic[];
    }>;

/** Compiles the exact canonical Workspace revision into the exported test project. */
export const createProjectTestExecutionPlan = (
  workspace: WorkspaceSnapshot
): ProjectTestExecutionPlan => {
  const project = createWorkspaceBrowserProjectPlan(workspace);
  if (project.status === 'blocked') return project;
  const request = createExecutionRequest({
    requestId: createClientExecutionRequestId('project-test'),
    profile: 'test',
    runtimeZone: 'test',
    workspace: project.workspace,
    invocation: {
      kind: 'test',
      targetRef: { kind: 'workspace', workspaceId: workspace.id },
      entrypoint: 'workspace',
    },
    requiredCapabilities: [
      'artifacts',
      'cancellation',
      'dependency-install',
      'diagnostics',
      'filesystem',
      'source-trace',
      'streaming-logs',
      'test',
      'timeout',
    ],
    timeoutMs: 120_000,
  });
  return Object.freeze({
    status: 'ready',
    snapshot: project.snapshot,
    request,
  });
};
