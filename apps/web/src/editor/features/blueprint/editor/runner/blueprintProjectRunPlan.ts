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

export type BlueprintProjectRunPlan =
  | Readonly<{
      status: 'ready';
      snapshot: BrowserProjectSnapshot;
      request: ExecutionRequest;
    }>
  | Readonly<{
      status: 'blocked';
      diagnostics: readonly CompileDiagnostic[];
    }>;

/** Compiles one canonical Workspace revision into a standalone runner input. */
export const createBlueprintProjectRunPlan = (
  workspace: WorkspaceSnapshot
): BlueprintProjectRunPlan => {
  const project = createWorkspaceBrowserProjectPlan(workspace);
  if (project.status === 'blocked') return project;
  const request = createExecutionRequest({
    requestId: createClientExecutionRequestId('project-run'),
    profile: 'preview',
    runtimeZone: 'client',
    workspace: project.workspace,
    invocation: {
      kind: 'workspace',
      targetRef: { kind: 'workspace', workspaceId: workspace.id },
    },
    requiredCapabilities: [
      'artifacts',
      'cancellation',
      'console',
      'dependency-install',
      'filesystem',
      'hmr',
      'streaming-logs',
    ],
  });
  return Object.freeze({
    status: 'ready',
    snapshot: project.snapshot,
    request,
  });
};
