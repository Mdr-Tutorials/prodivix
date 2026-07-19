import type { CodeAuthoringOriginSurface } from '@prodivix/authoring';
import type { ExecutionSourceTrace } from '@prodivix/runtime-core';
import {
  decodeWorkspaceDataSourceDocument,
  type WorkspaceSnapshot,
} from '@prodivix/workspace';
import { openWorkspaceCodeArtifact } from '@/editor/features/code';
import type { ExecutionSourceNavigationResult } from './executionServerFunctionModel';
import { createWorkspaceExecutionSnapshotId } from './workspaceExecutionIdentity';

/** Opens only a canonical CodeArtifact from the exact Workspace snapshot that produced the trace. */
export const openWorkspaceExecutionSourceTrace = (input: {
  workspace: WorkspaceSnapshot;
  snapshotId: string;
  sourceTrace: ExecutionSourceTrace;
  originSurface: CodeAuthoringOriginSurface;
  openDataOperation?(
    target: Readonly<{
      documentId: string;
      operationId: string;
    }>
  ): boolean;
  openSemanticTarget?(sourceTrace: ExecutionSourceTrace): boolean;
}): ExecutionSourceNavigationResult => {
  if (
    createWorkspaceExecutionSnapshotId(input.workspace) !== input.snapshotId
  ) {
    return Object.freeze({ status: 'unavailable', reason: 'snapshot-stale' });
  }
  if (input.sourceTrace.sourceRef.kind === 'data-operation') {
    const document =
      input.workspace.docsById[input.sourceTrace.sourceRef.documentId];
    const decoded =
      document?.type === 'data-source'
        ? decodeWorkspaceDataSourceDocument(document)
        : undefined;
    if (
      decoded?.status !== 'valid' ||
      !decoded.decodedContent.operationsById[
        input.sourceTrace.sourceRef.operationId
      ] ||
      !input.openDataOperation?.({
        documentId: input.sourceTrace.sourceRef.documentId,
        operationId: input.sourceTrace.sourceRef.operationId,
      })
    ) {
      return Object.freeze({
        status: 'unavailable',
        reason: 'source-unavailable',
      });
    }
    return Object.freeze({ status: 'opened' });
  }
  if (input.sourceTrace.sourceRef.kind !== 'code-artifact') {
    return input.openSemanticTarget?.(input.sourceTrace)
      ? Object.freeze({ status: 'opened' })
      : Object.freeze({
          status: 'unavailable',
          reason: 'source-unavailable',
        });
  }
  const result = openWorkspaceCodeArtifact({
    workspace: input.workspace,
    artifactId: input.sourceTrace.sourceRef.artifactId,
    presentation: 'maximized',
    ...(input.sourceTrace.sourceSpan
      ? { sourceSpan: input.sourceTrace.sourceSpan }
      : {}),
    origin: {
      surface: input.originSurface,
      targetRef: input.sourceTrace.sourceRef,
    },
  });
  return result.status === 'opened'
    ? Object.freeze({ status: 'opened' })
    : Object.freeze({ status: 'unavailable', reason: 'source-unavailable' });
};
