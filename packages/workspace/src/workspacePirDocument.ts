import type { PIRDocument } from '@prodivix/pir';
import type {
  WorkspaceCommandEnvelope,
  WorkspacePatchOperation,
} from './workspaceCommand';
import type { WorkspaceSnapshot } from './types';

export type CreateWorkspacePirDocumentUpdateCommandInput = {
  after: PIRDocument;
  before: PIRDocument;
  commandId: string;
  documentId?: string;
  issuedAt?: string;
  label?: string;
  mergeKey?: string;
  namespace?: string;
  type?: string;
  workspace: WorkspaceSnapshot;
};

const appendOptionalDocumentPatch = (
  forwardOps: WorkspacePatchOperation[],
  reverseOps: WorkspacePatchOperation[],
  path: string,
  before: unknown,
  after: unknown
): void => {
  if (Object.is(before, after)) return;
  if (before === undefined) {
    forwardOps.push({ op: 'add', path, value: after });
    reverseOps.unshift({ op: 'remove', path });
    return;
  }
  if (after === undefined) {
    forwardOps.push({ op: 'remove', path });
    reverseOps.unshift({ op: 'add', path, value: before });
    return;
  }
  forwardOps.push({ op: 'replace', path, value: after });
  reverseOps.unshift({ op: 'replace', path, value: before });
};

/** Builds a reversible command that updates one canonical PIR document. */
export const createWorkspacePirDocumentUpdateCommand = (
  input: CreateWorkspacePirDocumentUpdateCommandInput
): WorkspaceCommandEnvelope | null => {
  const documentId = input.documentId ?? input.workspace.activeDocumentId;
  if (!documentId) return null;
  const forwardOps: WorkspacePatchOperation[] = [];
  const reverseOps: WorkspacePatchOperation[] = [];
  appendOptionalDocumentPatch(
    forwardOps,
    reverseOps,
    '/componentContract',
    input.before.componentContract,
    input.after.componentContract
  );
  appendOptionalDocumentPatch(
    forwardOps,
    reverseOps,
    '/ui/graph',
    input.before.ui.graph,
    input.after.ui.graph
  );
  appendOptionalDocumentPatch(
    forwardOps,
    reverseOps,
    '/logic',
    input.before.logic,
    input.after.logic
  );
  appendOptionalDocumentPatch(
    forwardOps,
    reverseOps,
    '/metadata',
    input.before.metadata,
    input.after.metadata
  );
  if (!forwardOps.length) return null;
  const namespace = input.namespace ?? 'core.pir';
  return {
    id: input.commandId,
    namespace,
    type: input.type ?? 'document.update',
    version: '1.0',
    issuedAt: input.issuedAt ?? new Date().toISOString(),
    forwardOps,
    reverseOps,
    target: { workspaceId: input.workspace.id, documentId },
    domainHint: 'pir',
    ...(input.mergeKey ? { mergeKey: input.mergeKey } : {}),
    ...(input.label ? { label: input.label } : {}),
  };
};
