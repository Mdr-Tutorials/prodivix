import {
  createAnimationExecutionInvocationInput,
  createAnimationExecutionProvider,
  getAnimationTimelineTotalDurationMs,
  type AnimationDefinition,
  type AnimationRuntimePort,
} from '@prodivix/animation';
import {
  createExecutionRequest,
  type ExecutionJob,
} from '@prodivix/runtime-core';
import {
  selectWorkspaceAnimationDocument,
  type WorkspaceSnapshot,
} from '@prodivix/workspace';
import { executionSessionCoordinator } from './executionSessionEnvironment';
import {
  createClientExecutionRequestId,
  createWorkspaceExecutionSnapshotRef,
} from './workspaceExecutionIdentity';

export type StartWorkspaceAnimationExecutionInput = Readonly<{
  workspace: WorkspaceSnapshot;
  documentId: string;
  timelineId: string;
  runtime: AnimationRuntimePort;
}>;

export type WorkspaceAnimationExecution = Readonly<{
  sessionId: string;
  job: ExecutionJob;
}>;

const documentsByRequestId = new Map<string, AnimationDefinition>();
const runtimesByRequestId = new Map<string, AnimationRuntimePort>();

const provider = createAnimationExecutionProvider({
  resolveDocument: (request) => {
    const definition = documentsByRequestId.get(request.requestId);
    if (!definition) {
      throw new Error(
        `The Animation snapshot for request ${request.requestId} is unavailable.`
      );
    }
    return definition;
  },
  resolveRuntime: (request) => {
    const runtime = runtimesByRequestId.get(request.requestId);
    if (!runtime) {
      throw new Error(
        `The Animation runtime for request ${request.requestId} is unavailable.`
      );
    }
    return runtime;
  },
});

export const getWorkspaceAnimationExecutionSessionId = (
  workspaceId: string,
  documentId: string
): string => `workspace:${workspaceId}:animation:${documentId}`;

export const startWorkspaceAnimationExecution = async (
  input: StartWorkspaceAnimationExecutionInput
): Promise<WorkspaceAnimationExecution> => {
  const read = selectWorkspaceAnimationDocument(
    input.workspace,
    input.documentId
  );
  if (!read || read.status !== 'valid') {
    throw new Error(
      `Animation document ${input.documentId} is unavailable or invalid.`
    );
  }
  const timeline = read.decodedContent.timelines.find(
    (candidate) => candidate.id === input.timelineId
  );
  if (!timeline) {
    throw new Error(`Animation timeline ${input.timelineId} is unavailable.`);
  }

  const requestId = createClientExecutionRequestId('animation-run');
  const sessionId = getWorkspaceAnimationExecutionSessionId(
    input.workspace.id,
    input.documentId
  );
  await executionSessionCoordinator.cancel(sessionId, {
    reason: 'Superseded by a newer Animation execution.',
  });
  const durationMs = getAnimationTimelineTotalDurationMs(timeline);
  const timeoutMs = Number.isFinite(durationMs)
    ? Math.max(5_000, Math.ceil(durationMs + 2_000))
    : undefined;
  const request = createExecutionRequest({
    requestId,
    profile: 'preview',
    runtimeZone: 'client',
    workspace: createWorkspaceExecutionSnapshotRef(input.workspace),
    invocation: {
      kind: 'animation',
      targetRef: {
        kind: 'animation-timeline',
        documentId: input.documentId,
        timelineId: input.timelineId,
      },
      input: createAnimationExecutionInvocationInput(input.timelineId),
    },
    requiredCapabilities: [
      'cancellation',
      'diagnostics',
      'source-trace',
      'streaming-logs',
      ...(timeoutMs === undefined ? [] : (['timeout'] as const)),
    ],
    ...(timeoutMs === undefined ? {} : { timeoutMs }),
  });
  documentsByRequestId.set(requestId, read.decodedContent);
  runtimesByRequestId.set(requestId, input.runtime);

  try {
    const job = await provider.start(request);
    executionSessionCoordinator.activate({
      sessionId,
      label: `${read.document.name?.trim() || 'Animation'} · ${timeline.name || timeline.id}`,
      job,
    });
    void job.completion.finally(() => {
      documentsByRequestId.delete(requestId);
      runtimesByRequestId.delete(requestId);
    });
    return Object.freeze({ sessionId, job });
  } catch (error) {
    documentsByRequestId.delete(requestId);
    runtimesByRequestId.delete(requestId);
    throw error;
  }
};

export const stopWorkspaceAnimationExecution = (
  workspaceId: string,
  documentId: string,
  reason = 'Animation execution stopped by the user.'
) =>
  executionSessionCoordinator.cancel(
    getWorkspaceAnimationExecutionSessionId(workspaceId, documentId),
    { reason }
  );
