import type { StateCreator } from 'zustand';
import type { PIRDocument } from '@prodivix/shared/types/pir';
import { validatePirDocument } from '@prodivix/pir';
import {
  applyWorkspaceCommand,
  applyWorkspaceMutation as applyCanonicalWorkspaceMutation,
  applyWorkspaceTransaction,
  selectActivePirDocument,
  type DecodedWorkspaceMutation,
  type WorkspaceCommandApplyResult,
  type WorkspaceCommandEnvelope,
  type WorkspacePatchOperation,
  type WorkspaceSnapshot,
  type WorkspaceTransactionApplyResult,
  type WorkspaceTransactionEnvelope,
} from '@prodivix/workspace';
import type { EditorStore } from './editorStore.shape';

export type UpdateActivePirDocumentOptions = {
  commandId?: string;
  namespace?: string;
  type?: string;
  issuedAt?: string;
  mergeKey?: string;
  label?: string;
};

export interface WorkspaceSlice {
  workspace: WorkspaceSnapshot | null;
  documentEditSeqById: Record<string, number>;
  workspaceCapabilities: Record<string, boolean>;
  workspaceCapabilitiesLoaded: boolean;
  workspaceReadonly: boolean;
  setWorkspaceSnapshot: (workspace: WorkspaceSnapshot) => void;
  setWorkspaceCapabilities: (
    workspaceId: string,
    capabilities: Record<string, boolean>
  ) => void;
  setWorkspaceReadonly: (readonly: boolean) => void;
  clearWorkspaceState: () => void;
  setActiveDocumentId: (documentId: string | undefined) => void;
  applyWorkspaceMutation: (mutation: DecodedWorkspaceMutation) => void;
  dispatchWorkspaceCommand: (
    command: WorkspaceCommandEnvelope
  ) => WorkspaceCommandApplyResult | null;
  dispatchWorkspaceTransaction: (
    transaction: WorkspaceTransactionEnvelope
  ) => WorkspaceTransactionApplyResult | null;
  updateActivePirDocument: (
    updater: (document: PIRDocument) => PIRDocument,
    options?: UpdateActivePirDocumentOptions
  ) => WorkspaceCommandApplyResult | null;
}

const createCommandId = (): string => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `command-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
};

const incrementDocumentEditSequences = (
  current: Record<string, number>,
  documentIds: Iterable<string>
): Record<string, number> => {
  const uniqueDocumentIds = new Set(
    [...documentIds].map((documentId) => documentId.trim()).filter(Boolean)
  );
  if (!uniqueDocumentIds.size) return current;
  const next = { ...current };
  uniqueDocumentIds.forEach((documentId) => {
    next[documentId] = (next[documentId] ?? 0) + 1;
  });
  return next;
};

const appendOptionalDocumentPatch = (
  forwardOps: WorkspacePatchOperation[],
  reverseOps: WorkspacePatchOperation[],
  path: string,
  before: unknown,
  after: unknown
) => {
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

const createPirDocumentUpdateCommand = (
  workspace: WorkspaceSnapshot,
  before: PIRDocument,
  after: PIRDocument,
  options: UpdateActivePirDocumentOptions
): WorkspaceCommandEnvelope | null => {
  const documentId = workspace.activeDocumentId;
  if (!documentId || before.version !== after.version) return null;
  const forwardOps: WorkspacePatchOperation[] = [];
  const reverseOps: WorkspacePatchOperation[] = [];
  appendOptionalDocumentPatch(
    forwardOps,
    reverseOps,
    '/ui/graph',
    before.ui.graph,
    after.ui.graph
  );
  appendOptionalDocumentPatch(
    forwardOps,
    reverseOps,
    '/logic',
    before.logic,
    after.logic
  );
  appendOptionalDocumentPatch(
    forwardOps,
    reverseOps,
    '/animation',
    before.animation,
    after.animation
  );
  appendOptionalDocumentPatch(
    forwardOps,
    reverseOps,
    '/metadata',
    before.metadata,
    after.metadata
  );
  if (!forwardOps.length) return null;
  return {
    id: options.commandId ?? createCommandId(),
    namespace: options.namespace ?? 'core.pir',
    type: options.type ?? 'document.update',
    version: '1.0',
    issuedAt: options.issuedAt ?? new Date().toISOString(),
    forwardOps,
    reverseOps,
    target: { workspaceId: workspace.id, documentId },
    domainHint: 'pir',
    ...(options.mergeKey ? { mergeKey: options.mergeKey } : {}),
    ...(options.label ? { label: options.label } : {}),
  };
};

export const createWorkspaceSlice: StateCreator<
  EditorStore,
  [],
  [],
  WorkspaceSlice
> = (set, get) => ({
  workspace: null,
  documentEditSeqById: {},
  workspaceCapabilities: {},
  workspaceCapabilitiesLoaded: false,
  workspaceReadonly: false,
  setWorkspaceSnapshot: (workspace) =>
    set((state) => {
      const isSameWorkspace = state.workspace?.id === workspace.id;
      return {
        workspace,
        documentEditSeqById: {},
        workspaceCapabilities: isSameWorkspace
          ? state.workspaceCapabilities
          : {},
        workspaceCapabilitiesLoaded: isSameWorkspace
          ? state.workspaceCapabilitiesLoaded
          : false,
        workspaceReadonly: isSameWorkspace ? state.workspaceReadonly : false,
      };
    }),
  setWorkspaceCapabilities: (workspaceId, capabilities) =>
    set((state) => {
      const normalizedWorkspaceId = workspaceId.trim();
      if (
        !normalizedWorkspaceId ||
        normalizedWorkspaceId !== state.workspace?.id
      ) {
        return state;
      }
      return {
        workspaceCapabilities: { ...capabilities },
        workspaceCapabilitiesLoaded: true,
      };
    }),
  setWorkspaceReadonly: (readonly) =>
    set({ workspaceReadonly: Boolean(readonly) }),
  clearWorkspaceState: () =>
    set({
      workspace: null,
      documentEditSeqById: {},
      workspaceCapabilities: {},
      workspaceCapabilitiesLoaded: false,
      workspaceReadonly: false,
      runtimeStateByProject: {},
    }),
  setActiveDocumentId: (documentId) =>
    set((state) => {
      if (!state.workspace) return state;
      const normalizedDocumentId = documentId?.trim();
      if (!normalizedDocumentId) {
        if (state.workspace.activeDocumentId === undefined) return state;
        const { activeDocumentId: _activeDocumentId, ...workspace } =
          state.workspace;
        return { workspace };
      }
      if (!state.workspace.docsById[normalizedDocumentId]) return state;
      if (state.workspace.activeDocumentId === normalizedDocumentId) {
        return state;
      }
      return {
        workspace: {
          ...state.workspace,
          activeDocumentId: normalizedDocumentId,
        },
      };
    }),
  applyWorkspaceMutation: (mutation) =>
    set((state) => {
      if (!state.workspace || state.workspace.id !== mutation.workspaceId) {
        return state;
      }
      const workspace = applyCanonicalWorkspaceMutation(
        state.workspace,
        mutation
      );
      if (!mutation.removedDocumentIds.length) return { workspace };
      const documentEditSeqById = { ...state.documentEditSeqById };
      mutation.removedDocumentIds.forEach((documentId) => {
        delete documentEditSeqById[documentId];
      });
      return { workspace, documentEditSeqById };
    }),
  dispatchWorkspaceCommand: (command) => {
    const state = get();
    if (!state.workspace || state.workspaceReadonly) return null;
    const result = applyWorkspaceCommand(state.workspace, command);
    if (!result.ok) return result;
    set((current) => ({
      workspace: result.snapshot,
      documentEditSeqById: command.target.documentId
        ? incrementDocumentEditSequences(current.documentEditSeqById, [
            command.target.documentId,
          ])
        : current.documentEditSeqById,
    }));
    return result;
  },
  dispatchWorkspaceTransaction: (transaction) => {
    const state = get();
    if (!state.workspace || state.workspaceReadonly) return null;
    const result = applyWorkspaceTransaction(state.workspace, transaction);
    if (!result.ok) return result;
    const documentIds = transaction.commands.flatMap((command) =>
      command.target.documentId ? [command.target.documentId] : []
    );
    set((current) => ({
      workspace: result.snapshot,
      documentEditSeqById: incrementDocumentEditSequences(
        current.documentEditSeqById,
        documentIds
      ),
    }));
    return result;
  },
  updateActivePirDocument: (updater, options = {}) => {
    const state = get();
    if (!state.workspace || state.workspaceReadonly) return null;
    const activeDocument = selectActivePirDocument(state.workspace);
    if (!activeDocument) return null;
    const candidate = updater(activeDocument.content);
    if (candidate === activeDocument.content) return null;
    const validation = validatePirDocument(candidate);
    if (validation.hasError) return null;
    const command = createPirDocumentUpdateCommand(
      state.workspace,
      activeDocument.content,
      validation.document,
      options
    );
    return command ? state.dispatchWorkspaceCommand(command) : null;
  },
});
