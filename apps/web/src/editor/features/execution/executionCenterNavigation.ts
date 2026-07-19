import { useEffect, useState } from 'react';
import { create } from 'zustand';

export type ExecutionNetworkOperationTarget = Readonly<{
  workspaceId: string;
  documentId: string;
  operationId: string;
}>;

export type ExecutionCenterNavigationRequest = ExecutionNetworkOperationTarget &
  Readonly<{
    id: number;
    surface: 'network';
  }>;

type ExecutionCenterNavigationStore = Readonly<{
  request: ExecutionCenterNavigationRequest | null;
  openNetworkOperation(target: ExecutionNetworkOperationTarget): void;
  consume(requestId: number): void;
  clear(workspaceId?: string): void;
}>;

let nextRequestId = 0;

/** Carries only ephemeral UI focus; execution traces remain owned by the Session coordinator. */
export const useExecutionCenterNavigationStore =
  create<ExecutionCenterNavigationStore>()((set) => ({
    request: null,
    openNetworkOperation: (target) => {
      nextRequestId += 1;
      set({
        request: Object.freeze({
          ...target,
          id: nextRequestId,
          surface: 'network',
        }),
      });
    },
    consume: (requestId) =>
      set((state) =>
        state.request?.id === requestId ? { request: null } : state
      ),
    clear: (workspaceId) =>
      set((state) =>
        !state.request ||
        (workspaceId && state.request.workspaceId !== workspaceId)
          ? state
          : { request: null }
      ),
  }));

/**
 * Keeps a requested Execution Center visible after its one-shot focus request
 * is consumed. The latch stays component-local, so leaving the owning surface
 * closes it without creating durable execution state.
 */
export const useExecutionCenterNavigationVisibility = (
  workspaceId: string | undefined
): boolean => {
  const request = useExecutionCenterNavigationStore((state) => state.request);
  const [openedWorkspaceId, setOpenedWorkspaceId] = useState<string>();
  useEffect(() => {
    if (request && request.workspaceId === workspaceId) {
      setOpenedWorkspaceId(workspaceId);
    }
  }, [request, workspaceId]);
  return Boolean(workspaceId && openedWorkspaceId === workspaceId);
};
