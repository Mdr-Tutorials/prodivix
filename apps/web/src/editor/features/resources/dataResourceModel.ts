import type {
  DataConfigurationValue,
  DataImportProvenance,
  DataOperation,
} from '@prodivix/data';
import {
  decodeWorkspaceDataSourceDocument,
  type WorkspaceDocument,
  type WorkspaceSnapshot,
} from '@prodivix/workspace';

export type DataResourceOperationView = Readonly<{
  id: string;
  name: string;
  kind: DataOperation['kind'];
  method?: string;
  path?: string;
  inputSchemaId?: string;
  outputSchemaId: string;
  mappingCount: number;
  authorizationBindingIds: readonly string[];
  policyIds: readonly string[];
}>;

export type DataResourceProvenanceView = Readonly<{
  id: string;
  kind: DataImportProvenance['kind'];
  externalDocumentId: string;
  schemaCount: number;
  operationCount: number;
}>;

export type DataResourceDocumentView =
  | Readonly<{
      status: 'ready';
      id: string;
      path: string;
      contentRev: number;
      sourceId: string;
      sourceName: string;
      adapterId: string;
      runtimeZone: string;
      operations: readonly DataResourceOperationView[];
      provenance: readonly DataResourceProvenanceView[];
    }>
  | Readonly<{
      status: 'invalid';
      id: string;
      path: string;
      contentRev: number;
      issues: readonly Readonly<{
        code: string;
        path: string;
        message: string;
      }>[];
    }>;

export type DataResourceModel = Readonly<{
  documents: readonly DataResourceDocumentView[];
  sourceCount: number;
  operationCount: number;
  invalidCount: number;
}>;

const literalString = (
  value: DataConfigurationValue | undefined
): string | undefined =>
  value?.kind === 'literal' && typeof value.value === 'string'
    ? value.value
    : undefined;

const bindingId = (
  value: DataConfigurationValue | undefined
): string | undefined =>
  value?.kind === 'secret-ref' || value?.kind === 'environment-ref'
    ? value.reference.bindingId
    : undefined;

const countMappings = (value: DataConfigurationValue | undefined): number => {
  if (
    value?.kind !== 'literal' ||
    !value.value ||
    typeof value.value !== 'object' ||
    Array.isArray(value.value)
  ) {
    return 0;
  }
  return Object.values(value.value).reduce<number>((count, candidate) => {
    if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate))
      return count;
    return count + Object.keys(candidate).length;
  }, 0);
};

const projectOperation = (
  operation: DataOperation
): DataResourceOperationView =>
  Object.freeze({
    id: operation.id,
    name: operation.name ?? operation.id,
    kind: operation.kind,
    ...(literalString(operation.configurationByKey.method)
      ? { method: literalString(operation.configurationByKey.method) }
      : {}),
    ...(literalString(operation.configurationByKey.path)
      ? { path: literalString(operation.configurationByKey.path) }
      : {}),
    ...(operation.inputSchemaId
      ? { inputSchemaId: operation.inputSchemaId }
      : {}),
    outputSchemaId: operation.outputSchemaId,
    mappingCount: countMappings(operation.configurationByKey.parameterMappings),
    authorizationBindingIds: Object.freeze(
      [
        bindingId(operation.configurationByKey.authorization),
        bindingId(operation.configurationByKey.apiKey),
      ].filter((value): value is string => Boolean(value))
    ),
    policyIds: Object.freeze(
      Object.keys(operation.policies).sort((left, right) =>
        left.localeCompare(right)
      )
    ),
  });

/** Projects only canonical Data metadata; Secret values and imported source bytes are never exposed. */
export const buildDataResourceModelFromDocuments = (
  documentsById: Readonly<Record<string, WorkspaceDocument>> | undefined
): DataResourceModel => {
  if (!documentsById) {
    return Object.freeze({
      documents: Object.freeze([]),
      sourceCount: 0,
      operationCount: 0,
      invalidCount: 0,
    });
  }
  const documents = Object.values(documentsById)
    .filter((document) => document.type === 'data-source')
    .sort((left, right) =>
      left.path === right.path
        ? left.id.localeCompare(right.id)
        : left.path.localeCompare(right.path)
    )
    .map((document): DataResourceDocumentView => {
      const read = decodeWorkspaceDataSourceDocument(document);
      if (read.status !== 'valid') {
        return Object.freeze({
          status: 'invalid',
          id: document.id,
          path: document.path,
          contentRev: document.contentRev,
          issues: Object.freeze(
            read.status === 'invalid' ? [...read.issues] : []
          ),
        });
      }
      const source = read.decodedContent.source;
      return Object.freeze({
        status: 'ready',
        id: document.id,
        path: document.path,
        contentRev: document.contentRev,
        sourceId: source.id,
        sourceName: source.name ?? source.id,
        adapterId: source.adapterId,
        runtimeZone: source.runtimeZone,
        operations: Object.freeze(
          Object.values(read.decodedContent.operationsById)
            .sort((left, right) => left.id.localeCompare(right.id))
            .map(projectOperation)
        ),
        provenance: Object.freeze(
          Object.values(read.decodedContent.importProvenanceById ?? {})
            .sort((left, right) => left.id.localeCompare(right.id))
            .map((entry) =>
              Object.freeze({
                id: entry.id,
                kind: entry.kind,
                externalDocumentId: entry.externalDocumentId,
                schemaCount: Object.keys(entry.schemasByExternalId).length,
                operationCount: Object.keys(entry.operationsByExternalId)
                  .length,
              })
            )
        ),
      });
    });
  return Object.freeze({
    documents: Object.freeze(documents),
    sourceCount: documents.length,
    operationCount: documents.reduce(
      (count, document) =>
        count + (document.status === 'ready' ? document.operations.length : 0),
      0
    ),
    invalidCount: documents.filter((document) => document.status === 'invalid')
      .length,
  });
};

export const buildDataResourceModel = (
  workspace: WorkspaceSnapshot | null | undefined
): DataResourceModel =>
  buildDataResourceModelFromDocuments(workspace?.docsById);
