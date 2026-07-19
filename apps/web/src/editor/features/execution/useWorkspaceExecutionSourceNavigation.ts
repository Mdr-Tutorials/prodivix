import { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router';
import type { CodeAuthoringOriginSurface } from '@prodivix/authoring';
import type { ExecutionSourceTrace } from '@prodivix/runtime-core';
import type { WorkspaceSnapshot } from '@prodivix/workspace';
import { navigateToWorkspaceSemanticTarget } from '@/editor/navigation';
import type { ExecutionNetworkOperationFilter } from './executionNetworkModel';
import type {
  ExecutionSourceNavigationInput,
  ExecutionSourceNavigationResult,
} from './executionSourceTraceModel';
import { openWorkspaceExecutionSourceTrace } from './workspaceExecutionSourceNavigation';

/** Composes every execution product surface onto the same exact-snapshot source opener. */
export const useWorkspaceExecutionSourceNavigation = (input: {
  workspace?: WorkspaceSnapshot | null;
  originSurface: CodeAuthoringOriginSurface;
}) => {
  const navigate = useNavigate();
  const openSemanticTarget = useCallback(
    (sourceTrace: ExecutionSourceTrace): boolean => {
      const workspace = input.workspace;
      if (!workspace) return false;
      return (
        navigateToWorkspaceSemanticTarget({
          projectId: workspace.id,
          target: sourceTrace.sourceSpan
            ? { kind: 'source-span', sourceSpan: sourceTrace.sourceSpan }
            : {
                kind: 'diagnostic-target',
                targetRef: sourceTrace.sourceRef,
              },
          navigate,
        }).status === 'navigated'
      );
    },
    [input.workspace, navigate]
  );
  const openDataOperation = useCallback(
    (target: ExecutionNetworkOperationFilter): boolean => {
      const workspace = input.workspace;
      if (!workspace) return false;
      return (
        navigateToWorkspaceSemanticTarget({
          projectId: workspace.id,
          target: {
            kind: 'diagnostic-target',
            targetRef: { kind: 'data-operation', ...target },
          },
          navigate,
          preferredSurface: 'resources',
        }).status === 'navigated'
      );
    },
    [input.workspace, navigate]
  );
  const openSourceTrace = useCallback(
    (
      request: ExecutionSourceNavigationInput
    ): ExecutionSourceNavigationResult => {
      const workspace = input.workspace;
      if (!workspace) {
        return Object.freeze({
          status: 'unavailable' as const,
          reason: 'source-unavailable' as const,
        });
      }
      return openWorkspaceExecutionSourceTrace({
        workspace,
        snapshotId: request.snapshotId,
        sourceTrace: request.sourceTrace,
        originSurface: input.originSurface,
        openDataOperation,
        openSemanticTarget,
      });
    },
    [
      input.originSurface,
      input.workspace,
      openDataOperation,
      openSemanticTarget,
    ]
  );

  return useMemo(
    () => Object.freeze({ openSourceTrace, openDataOperation }),
    [openDataOperation, openSourceTrace]
  );
};
