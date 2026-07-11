import type { BlueprintSlice } from './editorStore.blueprintSlice';
import type { ProjectSlice } from './editorStore.projectSlice';
import type { RouteSlice } from './editorStore.routeSlice';
import type { WorkspaceSlice } from './editorStore.workspaceSlice';

export type EditorStore = WorkspaceSlice &
  RouteSlice &
  BlueprintSlice &
  ProjectSlice;
