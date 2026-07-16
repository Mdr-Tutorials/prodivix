import { createBrowserProjectRunner } from '@prodivix/runtime-browser';
import type {
  ExecutableProjectSnapshot,
  ExecutionJob,
  ExecutionRequest,
} from '@prodivix/runtime-core';
import {
  browserProjectRuntimeHost,
  executionSessionCoordinator,
  resolveBrowserProjectExecutionSnapshot,
  retainBrowserProjectExecutionSnapshot,
} from '@/editor/features/execution';

export const getBlueprintProjectExecutionSessionId = (
  workspaceId: string
): string => `workspace:${workspaceId}:project-preview`;

const runner = createBrowserProjectRunner({
  runtimeHost: browserProjectRuntimeHost,
  resolveProject: (request) =>
    resolveBrowserProjectExecutionSnapshot(
      request.workspace.workspaceId,
      request.workspace.snapshotId
    ),
});

let consumerCount = 0;
let pendingStop: ReturnType<typeof globalThis.setTimeout> | undefined;

export const startBlueprintProject = async (
  snapshot: ExecutableProjectSnapshot,
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
    sessionId: getBlueprintProjectExecutionSessionId(
      snapshot.workspace.workspaceId
    ),
    label: 'Project Preview',
    job,
  });
  return job;
};

export const stopBlueprintProject = (reason = 'Project execution stopped.') =>
  runner.stop(reason);

export const acquireBlueprintProjectRunner = (): (() => void) => {
  consumerCount += 1;
  if (pendingStop !== undefined) {
    globalThis.clearTimeout(pendingStop);
    pendingStop = undefined;
  }
  let released = false;
  return () => {
    if (released) return;
    released = true;
    consumerCount = Math.max(0, consumerCount - 1);
    if (consumerCount) return;
    pendingStop = globalThis.setTimeout(() => {
      pendingStop = undefined;
      if (!consumerCount) {
        void runner.stop('Run mode closed.');
      }
    }, 0);
  };
};
