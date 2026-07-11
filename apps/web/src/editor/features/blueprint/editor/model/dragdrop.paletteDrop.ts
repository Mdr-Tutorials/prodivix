import type { PIRDocument } from '@prodivix/shared/types/pir';
import type { PaletteQueryService } from '@/plugins/platform';
import { applyPaletteItemInsertion } from '@/editor/features/blueprint/editor/model/paletteCreation';
import type { BlueprintCompositionIssue } from '@/editor/features/blueprint/editor/model/composition';
import type { DragOverData, PaletteItemDragData } from './dragdrop.types';
import type { WorkspacePirDocumentType } from '@prodivix/workspace';
import type { WorkspaceCommandEnvelope } from '@prodivix/workspace';

export type PaletteDropResult = {
  doc: PIRDocument;
  nextNodeId: string;
  compositionIssue?: BlueprintCompositionIssue;
  command?: WorkspaceCommandEnvelope;
};

export const applyPaletteItemDrop = (
  doc: PIRDocument,
  data: PaletteItemDragData,
  overData: DragOverData | null | undefined,
  context: {
    workspaceId: string;
    documentId: string;
    documentType: WorkspacePirDocumentType;
    selectedId?: string;
    palette: PaletteQueryService;
  }
): PaletteDropResult => {
  const itemId = String(data.itemId);
  const variantProps = data.variantProps;
  const selectedSize = data.selectedSize;
  const selectedStatus = data.selectedStatus;
  const dropKind = overData?.kind;
  const dropNodeId =
    dropKind === 'tree-node'
      ? String((overData as { nodeId?: unknown }).nodeId)
      : null;
  const preferredTargetId =
    dropNodeId ??
    (dropKind === 'canvas'
      ? (context.selectedId ?? doc.ui.graph.rootId)
      : doc.ui.graph.rootId);

  const result = applyPaletteItemInsertion(doc, context.palette, {
    workspaceId: context.workspaceId,
    documentId: context.documentId,
    documentType: context.documentType,
    itemId,
    preferredTargetId,
    selection: { variantProps, selectedSize, selectedStatus },
  });
  if (result.ok === false) {
    return {
      doc,
      nextNodeId: '',
      ...(result.compositionIssue
        ? { compositionIssue: result.compositionIssue }
        : {}),
    };
  }
  return {
    doc: result.doc,
    nextNodeId: result.nextNodeId,
    command: result.command,
  };
};
