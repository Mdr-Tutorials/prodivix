import type { PIRDocument } from '@prodivix/shared/types/pir';
import type { PaletteQueryService } from '@/plugins/platform';
import type { TreeDropPlacement } from '@/editor/features/blueprint/editor/model/tree';
import type { BlueprintCompositionIssue } from '@/editor/features/blueprint/editor/model/composition';
import type {
  WorkspaceCommandApplyResult,
  WorkspaceCommandEnvelope,
  WorkspacePirDocumentType,
} from '@prodivix/workspace';

export type TreeDropHint = {
  overNodeId: string;
  placement: TreeDropPlacement;
} | null;

export type PaletteItemDragData = {
  kind: 'palette-item';
  itemId: string;
  variantProps?: Record<string, unknown>;
  selectedSize?: string;
  selectedStatus?: string;
};

export type TreeSortDragData = {
  kind: 'tree-sort';
  nodeId: string;
  parentId?: string;
};

export type TreeNodeDropData = {
  kind: 'tree-node';
  nodeId: string;
};

export type TreeSortDropData = {
  kind: 'tree-sort';
  nodeId: string;
};

export type TreeRootDropData = {
  kind: 'tree-root';
};

export type CanvasDropData = {
  kind: 'canvas';
};

export type DragActiveData =
  | PaletteItemDragData
  | TreeSortDragData
  | { kind: string; [key: string]: unknown };

export type DragOverData =
  | TreeNodeDropData
  | TreeSortDropData
  | TreeRootDropData
  | CanvasDropData
  | { kind: string; [key: string]: unknown };

export type UseBlueprintDragDropOptions = {
  pirDoc: PIRDocument;
  workspaceId: string;
  documentId: string;
  documentType: WorkspacePirDocumentType;
  selectedId?: string;
  palette: PaletteQueryService;
  updateActivePirDocument: (
    updater: (doc: PIRDocument) => PIRDocument,
    options?: {
      namespace?: string;
      type?: string;
      mergeKey?: string;
      label?: string;
    }
  ) => WorkspaceCommandApplyResult | null;
  dispatchWorkspaceCommand: (
    command: WorkspaceCommandEnvelope
  ) => WorkspaceCommandApplyResult | null;
  onNodeSelect: (nodeId: string) => void;
  onCompositionIssue?: (issue: BlueprintCompositionIssue | undefined) => void;
};
