import type { StateCreator } from 'zustand';
import {
  hasRouteNodeId,
  normalizeRouteManifest,
  resolveActiveRouteNodeId,
  resolveDefaultActiveRouteNodeId,
} from './editorStore.normalizers';
import { applyRouteIntentToState } from './editorStore.routeIntent';
import {
  DEFAULT_ROUTE_MANIFEST,
  type RouteIntent,
  type WorkspaceRouteManifest,
} from './editorStore.types';
import { findRouteNodeById, updateRouteNodeById } from './routeManifest';
import type { EditorStore } from './editorStore.shape';

export interface RouteSlice {
  routeManifest: WorkspaceRouteManifest;
  activeRouteNodeId?: string;
  setActiveRouteNodeId: (routeNodeId: string | undefined) => void;
  updateRouteManifest: (
    updater: (manifest: WorkspaceRouteManifest) => WorkspaceRouteManifest
  ) => void;
  applyRouteIntent: (intent: RouteIntent) => void;
  bindOutletToRoute: (
    routeNodeId: string,
    outletNodeId: string | undefined
  ) => void;
}

export const createRouteSlice: StateCreator<EditorStore, [], [], RouteSlice> = (
  set
) => ({
  routeManifest: DEFAULT_ROUTE_MANIFEST,
  activeRouteNodeId: undefined,
  setActiveRouteNodeId: (routeNodeId) =>
    set((state) => {
      const normalizedRouteNodeId = routeNodeId?.trim();
      if (!normalizedRouteNodeId) {
        return {
          activeRouteNodeId: resolveDefaultActiveRouteNodeId(
            state.routeManifest
          ),
        };
      }
      if (!hasRouteNodeId(state.routeManifest.root, normalizedRouteNodeId)) {
        return state;
      }
      return { activeRouteNodeId: normalizedRouteNodeId };
    }),
  updateRouteManifest: (updater) =>
    set((state) => {
      if (state.workspaceReadonly) return state;
      const nextRouteManifest = normalizeRouteManifest(
        updater(state.routeManifest)
      );
      const nextActiveRouteNodeId = resolveActiveRouteNodeId(
        nextRouteManifest,
        [state.activeRouteNodeId]
      );
      return {
        routeManifest: nextRouteManifest,
        activeRouteNodeId: nextActiveRouteNodeId,
      };
    }),
  applyRouteIntent: (intent) =>
    set((state) => {
      if (state.workspaceReadonly) return state;
      const next = applyRouteIntentToState(state, intent);
      if (!next) return state;
      return next;
    }),
  bindOutletToRoute: (routeNodeId, outletNodeId) =>
    set((state) => {
      if (state.workspaceReadonly) return state;
      const normalizedRouteNodeId = routeNodeId.trim();
      if (!normalizedRouteNodeId) return state;
      const normalizedOutletNodeId = outletNodeId?.trim();
      const currentNode = findRouteNodeById(
        state.routeManifest.root,
        normalizedRouteNodeId
      );
      if (!currentNode) return state;
      if ((currentNode.outletNodeId ?? '') === (normalizedOutletNodeId ?? '')) {
        return state;
      }
      const nextManifest: WorkspaceRouteManifest = {
        ...state.routeManifest,
        root: updateRouteNodeById(
          state.routeManifest.root,
          normalizedRouteNodeId,
          (target) => ({
            ...target,
            outletNodeId: normalizedOutletNodeId || undefined,
          })
        ),
      };
      return {
        routeManifest: normalizeRouteManifest(nextManifest),
      };
    }),
});
