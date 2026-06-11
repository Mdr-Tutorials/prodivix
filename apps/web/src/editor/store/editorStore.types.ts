export type BlueprintState = {
  viewportWidth: string;
  viewportHeight: string;
  zoom: number;
  pan: { x: number; y: number };
  selectedId?: string;
  hiddenNodeIds: string[];
};

export type WorkspaceRouteNode = {
  id: string;
  segment?: string;
  index?: boolean;
  layoutDocId?: string;
  pageDocId?: string;
  outletNodeId?: string;
  children?: WorkspaceRouteNode[];
};

export type WorkspaceRouteManifest = {
  version: string;
  root: WorkspaceRouteNode;
};

export type WorkspaceVfsNode = {
  id: string;
  kind: 'dir' | 'doc';
  name: string;
  parentId: string | null;
  children?: string[];
  docId?: string;
};

export type RouteIntent =
  | {
      type: 'create-page';
      path: string;
      routeNodeId?: string;
    }
  | {
      type: 'create-child-route';
      parentRouteNodeId: string;
      segment: string;
      routeNodeId?: string;
      pageDocId?: string;
    }
  | {
      type: 'split-layout';
      routeNodeId: string;
      layoutDocId?: string;
    }
  | {
      type: 'delete-route';
      routeNodeId: string;
    };

export const DEFAULT_BLUEPRINT_STATE: BlueprintState = {
  viewportWidth: '1440',
  viewportHeight: '900',
  zoom: 100,
  pan: { x: 80, y: 60 },
  selectedId: undefined,
  hiddenNodeIds: [],
};

export const DEFAULT_ROUTE_MANIFEST: WorkspaceRouteManifest = {
  version: '1',
  root: {
    id: 'root',
    children: [],
  },
};
