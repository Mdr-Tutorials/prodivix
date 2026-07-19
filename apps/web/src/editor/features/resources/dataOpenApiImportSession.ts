import {
  createDataOpenApiImportProposal,
  DATA_OPENAPI_IMPORT_LIMITS,
  type DataOpenApiImpactApproval,
  type DataOpenApiImportProposal,
} from '@prodivix/data-http';
import {
  decodeWorkspaceDataSourceDocument,
  type WorkspaceSnapshot,
} from '@prodivix/workspace';

export type DataOpenApiImportDraft = Readonly<{
  documentId: string;
  documentPath: string;
  importId: string;
  externalDocumentId: string;
  sourceId: string;
  runtimeZone: 'client' | 'server' | 'edge';
  baseUrl: string;
  specification: string;
}>;

export type DataOpenApiImportPreview =
  | Readonly<{
      status: 'invalid-input';
      code:
        | 'DATA_OPENAPI_INPUT_EMPTY'
        | 'DATA_OPENAPI_INPUT_TOO_LARGE'
        | 'DATA_OPENAPI_INPUT_JSON_INVALID'
        | 'DATA_OPENAPI_TARGET_INVALID'
        | 'DATA_OPENAPI_PATH_INVALID';
      message: string;
    }>
  | Readonly<{
      status: 'proposal';
      proposal: DataOpenApiImportProposal;
      expectedContentRev?: number;
      documentPath: string;
    }>;

const invalid = (
  code: Extract<DataOpenApiImportPreview, { status: 'invalid-input' }>['code'],
  message: string
): DataOpenApiImportPreview =>
  Object.freeze({ status: 'invalid-input', code, message });

/** Builds a revision-fenced preview without writing Workspace state or fetching the external identity URL. */
export const createDataOpenApiImportPreview = (input: {
  workspace: WorkspaceSnapshot;
  draft: DataOpenApiImportDraft;
  impactApproval?: DataOpenApiImpactApproval;
}): DataOpenApiImportPreview => {
  const specification = input.draft.specification.trim();
  if (!specification) {
    return invalid(
      'DATA_OPENAPI_INPUT_EMPTY',
      'Paste an OpenAPI 3.1 JSON document before generating a preview.'
    );
  }
  if (
    new TextEncoder().encode(specification).byteLength >
    DATA_OPENAPI_IMPORT_LIMITS.maxDocumentBytes
  ) {
    return invalid(
      'DATA_OPENAPI_INPUT_TOO_LARGE',
      'The OpenAPI document exceeds the bounded import budget.'
    );
  }
  let spec: unknown;
  try {
    spec = JSON.parse(specification) as unknown;
  } catch {
    return invalid(
      'DATA_OPENAPI_INPUT_JSON_INVALID',
      'The OpenAPI document is not valid JSON.'
    );
  }
  if (
    !input.draft.documentPath.startsWith('/') ||
    input.draft.documentPath.includes('\0') ||
    input.draft.documentPath.includes('\\')
  ) {
    return invalid(
      'DATA_OPENAPI_PATH_INVALID',
      'The target must use an absolute canonical Workspace path.'
    );
  }

  const current = input.workspace.docsById[input.draft.documentId];
  if (current && current.type !== 'data-source') {
    return invalid(
      'DATA_OPENAPI_TARGET_INVALID',
      'The target document identity is already owned by another Workspace document type.'
    );
  }
  const currentRead = current
    ? decodeWorkspaceDataSourceDocument(current)
    : undefined;
  if (currentRead && currentRead.status !== 'valid') {
    return invalid(
      'DATA_OPENAPI_TARGET_INVALID',
      'The existing Data source must be canonical before reimport.'
    );
  }

  const proposal = createDataOpenApiImportProposal({
    spec,
    documentId: input.draft.documentId,
    importId: input.draft.importId,
    externalDocumentId: input.draft.externalDocumentId,
    sourceId: input.draft.sourceId,
    runtimeZone: input.draft.runtimeZone,
    ...(input.draft.baseUrl.trim()
      ? { baseUrl: input.draft.baseUrl.trim() }
      : {}),
    ...(currentRead?.status === 'valid'
      ? { currentDocument: currentRead.decodedContent }
      : {}),
    ...(input.impactApproval ? { impactApproval: input.impactApproval } : {}),
  });
  return Object.freeze({
    status: 'proposal',
    proposal,
    ...(current ? { expectedContentRev: current.contentRev } : {}),
    documentPath: input.draft.documentPath,
  });
};
