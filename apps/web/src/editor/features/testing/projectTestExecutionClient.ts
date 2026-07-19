import { createBrowserProjectTestRunner } from '@prodivix/runtime-browser';
import type {
  ExecutableProjectSnapshot,
  ExecutionJob,
  ExecutionRequest,
} from '@prodivix/runtime-core';
import { isExecutionJobTerminalStatus } from '@prodivix/runtime-core';
import {
  browserProjectRuntimeHost,
  createRemoteProjectExecutionEnvironment,
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

export type ProjectTestExecutionProvider = 'browser' | 'remote';

let activeJob: ExecutionJob | undefined;

export const startProjectTests = async (
  snapshot: ExecutableProjectSnapshot,
  request: ExecutionRequest,
  options: Readonly<{
    provider?: ProjectTestExecutionProvider;
    accessToken?: string | null;
  }> = {}
): Promise<ExecutionJob> => {
  if (
    activeJob &&
    !isExecutionJobTerminalStatus(activeJob.getSnapshot().status)
  )
    throw new Error(
      'The previous Workspace Test must reach a terminal state before another provider starts.'
    );
  const provider = options.provider ?? 'browser';
  let job: ExecutionJob;
  if (provider === 'remote') {
    if (!options.accessToken?.trim())
      throw new Error('Remote Test requires an authenticated session.');
    const environment = createRemoteProjectExecutionEnvironment({
      accessToken: options.accessToken,
      resolveSnapshot: (candidate) => {
        if (
          candidate.profile !== 'test' ||
          candidate.runtimeZone !== 'test' ||
          candidate.environment !== undefined ||
          candidate.workspace.workspaceId !== snapshot.workspace.workspaceId ||
          candidate.workspace.snapshotId !== snapshot.workspace.snapshotId ||
          JSON.stringify(candidate.workspace.partitionRevisions ?? {}) !==
            JSON.stringify(snapshot.workspace.partitionRevisions ?? {})
        )
          throw new Error(
            'Remote Test snapshot identity or mock-only policy drifted.'
          );
        return { kind: 'upload', snapshot };
      },
    });
    job = await environment.testProvider.start(request);
  } else {
    const releaseSnapshot = retainBrowserProjectExecutionSnapshot(snapshot);
    try {
      job = await runner.provider.start(request);
    } catch (error) {
      releaseSnapshot();
      throw error;
    }
    void job.completion.finally(releaseSnapshot);
  }
  activeJob = job;
  void job.completion.finally(() => {
    if (activeJob === job) activeJob = undefined;
  });
  executionSessionCoordinator.activate({
    sessionId: getProjectTestExecutionSessionId(snapshot.workspace.workspaceId),
    label: 'Workspace Tests',
    job,
  });
  return job;
};

export const stopProjectTests = (
  reason = 'Workspace test execution stopped.'
): Promise<void> => {
  const job = activeJob;
  if (!job) return runner.stop(reason);
  return job.cancel({ reason }).then(() => undefined);
};
