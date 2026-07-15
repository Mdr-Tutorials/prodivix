import {
  createNodeGraphExecutionInvocationInput,
  createNodeGraphExecutionProvider,
  type NodeGraphDocument,
} from '@prodivix/nodegraph';
import {
  createExecutionRequest,
  type ExecutionJob,
} from '@prodivix/runtime-core';
import {
  selectWorkspaceNodeGraphDocument,
  type WorkspaceSnapshot,
} from '@prodivix/workspace';
import { executionSessionCoordinator } from './executionSessionEnvironment';
import {
  createClientExecutionRequestId,
  createWorkspaceExecutionSnapshotRef,
} from './workspaceExecutionIdentity';

export type StartWorkspaceNodeGraphExecutionInput = Readonly<{
  workspace: WorkspaceSnapshot;
  documentId: string;
  input?: unknown;
  params?: Readonly<Record<string, unknown>>;
  source?: Readonly<{
    ownerId: string;
    trigger: string;
    eventKey: string;
  }>;
}>;

export type WorkspaceNodeGraphExecution = Readonly<{
  sessionId: string;
  job: ExecutionJob;
}>;

const documentsByRequestId = new Map<string, NodeGraphDocument>();

const provider = createNodeGraphExecutionProvider({
  resolveDocument: (request) => {
    const document = documentsByRequestId.get(request.requestId);
    if (!document) {
      throw new Error(
        `The NodeGraph snapshot for request ${request.requestId} is unavailable.`
      );
    }
    return document;
  },
});

export const getWorkspaceNodeGraphExecutionSessionId = (
  workspaceId: string,
  documentId: string
): string => `workspace:${workspaceId}:nodegraph:${documentId}`;

export const startWorkspaceNodeGraphExecution = async (
  input: StartWorkspaceNodeGraphExecutionInput
): Promise<WorkspaceNodeGraphExecution> => {
  const read = selectWorkspaceNodeGraphDocument(
    input.workspace,
    input.documentId
  );
  if (!read || read.status !== 'valid') {
    throw new Error(
      `NodeGraph document ${input.documentId} is unavailable or invalid.`
    );
  }

  const requestId = createClientExecutionRequestId('nodegraph-run');
  const sessionId = getWorkspaceNodeGraphExecutionSessionId(
    input.workspace.id,
    input.documentId
  );
  await executionSessionCoordinator.cancel(sessionId, {
    reason: 'Superseded by a newer NodeGraph execution.',
  });
  const request = createExecutionRequest({
    requestId,
    profile: 'preview',
    runtimeZone: 'client',
    workspace: createWorkspaceExecutionSnapshotRef(input.workspace),
    invocation: {
      kind: 'nodegraph',
      targetRef: {
        kind: 'document',
        workspaceId: input.workspace.id,
        documentId: input.documentId,
      },
      input: createNodeGraphExecutionInvocationInput({
        input: input.input,
        params: input.params,
      }),
    },
    requiredCapabilities: [
      'cancellation',
      'diagnostics',
      'source-trace',
      'streaming-logs',
    ],
    timeoutMs: 10_000,
    metadata: {
      sourceOwnerId: input.source?.ownerId ?? input.documentId,
      trigger: input.source?.trigger ?? 'manual',
      eventKey: input.source?.eventKey ?? 'run',
    },
  });
  documentsByRequestId.set(requestId, read.decodedContent);

  try {
    const job = await provider.start(request);
    executionSessionCoordinator.activate({
      sessionId,
      label: read.document.name?.trim() || 'NodeGraph',
      job,
    });
    void job.completion.finally(() => documentsByRequestId.delete(requestId));
    return Object.freeze({ sessionId, job });
  } catch (error) {
    documentsByRequestId.delete(requestId);
    throw error;
  }
};

export const stopWorkspaceNodeGraphExecution = (
  workspaceId: string,
  documentId: string,
  reason = 'NodeGraph execution stopped by the user.'
) =>
  executionSessionCoordinator.cancel(
    getWorkspaceNodeGraphExecutionSessionId(workspaceId, documentId),
    { reason }
  );
