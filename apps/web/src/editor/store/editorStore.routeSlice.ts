import type { StateCreator } from 'zustand';
import type {
  WorkspaceCommandApplyResult,
  WorkspaceRouteIntent,
  WorkspaceTransactionApplyResult,
} from '@prodivix/workspace';
import {
  createWorkspaceRouteIntentPlan,
  selectWorkspaceRoute,
} from '@prodivix/workspace';
import type { EditorStore } from './editorStore.shape';

export type RouteIntentDispatchResult =
  WorkspaceCommandApplyResult | WorkspaceTransactionApplyResult | null;

export interface RouteSlice {
  setActiveRouteNodeId: (routeNodeId: string | undefined) => void;
  applyRouteIntent: (intent: WorkspaceRouteIntent) => RouteIntentDispatchResult;
  bindOutletToRoute: (
    routeNodeId: string,
    outletNodeId: string | undefined
  ) => RouteIntentDispatchResult;
}

export const createRouteSlice: StateCreator<EditorStore, [], [], RouteSlice> = (
  set,
  get
) => ({
  setActiveRouteNodeId: (routeNodeId) =>
    set((state) => {
      if (!state.workspace) return state;
      const workspace = selectWorkspaceRoute(state.workspace, routeNodeId);
      return workspace && workspace !== state.workspace ? { workspace } : state;
    }),
  applyRouteIntent: (intent) => {
    const state = get();
    if (!state.workspace || state.workspaceReadonly) return null;
    const plan = createWorkspaceRouteIntentPlan(state.workspace, intent);
    if (!plan) return null;
    return plan.kind === 'command'
      ? state.dispatchWorkspaceCommand(plan.command)
      : state.dispatchWorkspaceTransaction(plan.transaction);
  },
  bindOutletToRoute: (routeNodeId, outletNodeId) => {
    const normalizedRouteNodeId = routeNodeId.trim();
    if (!normalizedRouteNodeId) return null;
    const normalizedOutletNodeId = outletNodeId?.trim();
    return get().applyRouteIntent(
      normalizedOutletNodeId
        ? {
            type: 'bind-outlet',
            routeNodeId: normalizedRouteNodeId,
            outletNodeId: normalizedOutletNodeId,
          }
        : { type: 'unbind-outlet', routeNodeId: normalizedRouteNodeId }
    );
  },
});
