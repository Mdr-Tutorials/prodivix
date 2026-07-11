import { validatePirDocument } from '@prodivix/pir';
import type { UiGraph } from '@prodivix/shared/types/pir';
import {
  applyWorkspaceTransaction,
  type WorkspaceCommandEnvelope,
  type WorkspaceTransactionEnvelope,
} from './workspaceCommand';
import { isWorkspaceCodeDocumentContent } from './workspaceCodeDocument';
import { createWorkspaceDocumentAtPathCommand } from './workspaceDocumentFactory';
import type { WorkspacePirDocument } from './workspaceSelectors';
import type { WorkspaceDocument, WorkspaceSnapshot } from './types';

export type CreateWorkspaceCodeBindingTransactionInput = Readonly<{
  workspace: WorkspaceSnapshot;
  ownerDocument: WorkspacePirDocument;
  codeDocument: WorkspaceDocument;
  afterGraph: UiGraph;
  transactionId?: string;
  issuedAt?: string;
  label?: string;
}>;

const createTransactionId = (): string =>
  `code-binding-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

/**
 * Plans one atomic authoring change that mounts a new CodeDocument in the VFS
 * and writes its already-projected CodeReference into the owning PIR graph.
 */
export const createWorkspaceCodeBindingTransaction = ({
  workspace,
  ownerDocument,
  codeDocument,
  afterGraph,
  transactionId = createTransactionId(),
  issuedAt = new Date().toISOString(),
  label = 'Create and bind code document',
}: CreateWorkspaceCodeBindingTransactionInput): WorkspaceTransactionEnvelope | null => {
  if (
    workspace.docsById[ownerDocument.id] !== ownerDocument ||
    codeDocument.type !== 'code' ||
    !isWorkspaceCodeDocumentContent(codeDocument.content) ||
    afterGraph === ownerDocument.content.ui.graph
  ) {
    return null;
  }

  const candidate = {
    ...ownerDocument.content,
    ui: { graph: afterGraph },
  };
  if (validatePirDocument(candidate).hasError) return null;

  const createDocumentCommand = createWorkspaceDocumentAtPathCommand({
    workspace,
    document: codeDocument,
    commandId: `${transactionId}:document`,
    issuedAt,
    label,
  });
  const bindOwnerCommand: WorkspaceCommandEnvelope = {
    id: `${transactionId}:owner`,
    namespace: 'core.code',
    type: 'reference.bind',
    version: '1.0',
    issuedAt,
    target: { workspaceId: workspace.id, documentId: ownerDocument.id },
    domainHint: 'pir',
    label,
    forwardOps: [{ op: 'replace', path: '/ui/graph', value: afterGraph }],
    reverseOps: [
      {
        op: 'replace',
        path: '/ui/graph',
        value: ownerDocument.content.ui.graph,
      },
    ],
  };
  const transaction: WorkspaceTransactionEnvelope = {
    id: transactionId,
    workspaceId: workspace.id,
    issuedAt,
    label,
    commands: [createDocumentCommand, bindOwnerCommand],
  };

  return applyWorkspaceTransaction(workspace, transaction).ok
    ? transaction
    : null;
};
