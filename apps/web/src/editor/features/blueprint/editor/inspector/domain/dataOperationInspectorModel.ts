import type { WorkspaceSymbol } from '@prodivix/authoring';
import {
  createDataSourceScopeId,
  type DataOperationKind,
  type DataOperationReference,
} from '@prodivix/data';
import type { WorkspaceSnapshot } from '@prodivix/workspace';
import { createWorkspaceCodeLanguageEnvironment } from '@/editor/codeLanguage';

export type DataOperationInspectorCandidate = Readonly<{
  id: string;
  label: string;
  detail: string;
  kind: DataOperationKind;
  reference: DataOperationReference;
}>;

const compareText = (left: string, right: string): number =>
  left < right ? -1 : left > right ? 1 : 0;

const projectCandidate = (
  symbol: WorkspaceSymbol,
  kind: DataOperationKind
): DataOperationInspectorCandidate | undefined => {
  if (
    symbol.kind !== 'data-operation' ||
    symbol.typeRef !== `data-operation:${kind}` ||
    symbol.ownerRef.kind !== 'data-operation'
  )
    return undefined;
  return Object.freeze({
    id: symbol.id,
    label: symbol.displayName ?? symbol.name,
    detail:
      symbol.qualifiedName ??
      `${symbol.ownerRef.documentId}.${symbol.ownerRef.operationId}`,
    kind,
    reference: Object.freeze({
      documentId: symbol.ownerRef.documentId,
      operationId: symbol.ownerRef.operationId,
    }),
  });
};

/** Projects revision-bound operation choices without scanning Data editor state. */
export const createDataOperationInspectorCandidates = (
  workspace: WorkspaceSnapshot,
  kind: DataOperationKind
): readonly DataOperationInspectorCandidate[] => {
  const composition =
    createWorkspaceCodeLanguageEnvironment(workspace).semanticComposition;
  if (composition.status !== 'ready') return Object.freeze([]);
  const candidates = Object.values(workspace.docsById)
    .filter((document) => document.type === 'data-source')
    .flatMap((document) => {
      const result = composition.index.queryVisibleSymbols({
        scopeId: createDataSourceScopeId(workspace.id, document.id),
        symbolKinds: ['data-operation'],
        expectedTypeRef: `data-operation:${kind}`,
        expectedSnapshotIdentity: composition.index.snapshotIdentity,
      });
      if (result.status !== 'resolved') return [];
      return result.symbols.flatMap((symbol) => {
        const candidate = projectCandidate(symbol, kind);
        return candidate ? [candidate] : [];
      });
    })
    .filter(
      (candidate, index, values) =>
        values.findIndex(({ id }) => id === candidate.id) === index
    )
    .sort(
      (left, right) =>
        compareText(left.label, right.label) ||
        compareText(left.detail, right.detail) ||
        compareText(left.id, right.id)
    );
  return Object.freeze(candidates);
};
