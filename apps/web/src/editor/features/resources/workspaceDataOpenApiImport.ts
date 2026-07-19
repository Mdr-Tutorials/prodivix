import type { DataOpenApiImportProposal } from '@prodivix/data-http';
import {
  createWorkspaceDataSourceDocumentUpdateCommand,
  createWorkspaceDocumentAtPathCommand,
  type WorkspaceCommandEnvelope,
  type WorkspaceSnapshot,
} from '@prodivix/workspace';

export type CreateWorkspaceDataOpenApiAdoptionInput = Readonly<{
  workspace: WorkspaceSnapshot;
  proposal: DataOpenApiImportProposal;
  documentId: string;
  documentPath: string;
  commandId: string;
  issuedAt: string;
  expectedContentRev?: number;
}>;

export type WorkspaceDataOpenApiAdoptionResult =
  | Readonly<{
      status: 'ready';
      mode: 'create' | 'update';
      command: WorkspaceCommandEnvelope;
    }>
  | Readonly<{
      status: 'no-change';
    }>
  | Readonly<{
      status: 'blocked';
      reason:
        | 'proposal-not-ready'
        | 'proposal-target-mismatch'
        | 'target-type-mismatch'
        | 'revision-drift'
        | 'workspace-conflict';
    }>;

/**
 * Converts an inspected ready proposal into one reversible Workspace command.
 * It never applies the command and fences reimport against the inspected
 * content revision.
 */
export const createWorkspaceDataOpenApiAdoption = (
  input: CreateWorkspaceDataOpenApiAdoptionInput
): WorkspaceDataOpenApiAdoptionResult => {
  if (input.proposal.status !== 'ready') {
    return Object.freeze({
      status: 'blocked',
      reason: 'proposal-not-ready',
    });
  }
  if (input.proposal.target.documentId !== input.documentId) {
    return Object.freeze({
      status: 'blocked',
      reason: 'proposal-target-mismatch',
    });
  }
  const current = input.workspace.docsById[input.documentId];
  if (current) {
    if (current.type !== 'data-source') {
      return Object.freeze({
        status: 'blocked',
        reason: 'target-type-mismatch',
      });
    }
    if (
      input.expectedContentRev === undefined ||
      current.contentRev !== input.expectedContentRev
    ) {
      return Object.freeze({ status: 'blocked', reason: 'revision-drift' });
    }
    const command = createWorkspaceDataSourceDocumentUpdateCommand({
      workspace: input.workspace,
      documentId: input.documentId,
      after: input.proposal.document,
      commandId: input.commandId,
      issuedAt: input.issuedAt,
      label: 'Adopt OpenAPI reimport proposal',
    });
    return command
      ? Object.freeze({ status: 'ready', mode: 'update', command })
      : Object.freeze({ status: 'no-change' });
  }

  try {
    const command = createWorkspaceDocumentAtPathCommand({
      workspace: input.workspace,
      document: {
        id: input.documentId,
        type: 'data-source',
        path: input.documentPath,
        contentRev: 1,
        metaRev: 1,
        content: input.proposal.document,
      },
      commandId: input.commandId,
      issuedAt: input.issuedAt,
      label: 'Adopt OpenAPI import proposal',
    });
    return Object.freeze({ status: 'ready', mode: 'create', command });
  } catch {
    return Object.freeze({ status: 'blocked', reason: 'workspace-conflict' });
  }
};
