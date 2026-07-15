import {
  createBrowserProjectTestRunner,
  type BrowserProjectSnapshot,
} from '@prodivix/runtime-browser';
import type { ExecutionJob, ExecutionRequest } from '@prodivix/runtime-core';
import {
  browserProjectRuntimeHost,
  executionSessionCoordinator,
  resolveBrowserProjectExecutionSnapshot,
  retainBrowserProjectExecutionSnapshot,
} from '@/editor/features/execution';

export const getProjectTestExecutionSessionId = (workspaceId: string): string =>
  `workspace:${workspaceId}:project-tests`;

const runner = createBrowserProjectTestRunner({
  runtimeHost: browserProjectRuntimeHost,
  resolveProject: (request) =>
    resolveBrowserProjectExecutionSnapshot(
      request.workspace.workspaceId,
      request.workspace.snapshotId
    ),
});

export const startProjectTests = async (
  snapshot: BrowserProjectSnapshot,
  request: ExecutionRequest
): Promise<ExecutionJob> => {
  const releaseSnapshot = retainBrowserProjectExecutionSnapshot(snapshot);
  let job: ExecutionJob;
  try {
    job = await runner.provider.start(request);
  } catch (error) {
    releaseSnapshot();
    throw error;
  }
  void job.completion.finally(releaseSnapshot);
  executionSessionCoordinator.activate({
    sessionId: getProjectTestExecutionSessionId(snapshot.workspaceId),
    label: 'Workspace Tests',
    job,
  });
  return job;
};

export const stopProjectTests = (
  reason = 'Workspace test execution stopped.'
): Promise<void> => runner.stop(reason);
