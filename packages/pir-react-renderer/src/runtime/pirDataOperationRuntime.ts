import type { DataLifecycleSnapshot } from '@prodivix/data';
import {
  PIR_COLLECTION_DATA_LIFECYCLE_ISSUE_CODES,
  type PIRDataOperationBinding,
} from '@prodivix/pir';
import {
  PIR_RENDERER_BLOCKING_ISSUE_CODES,
  type PIRDataOperationRuntimePort,
  type PIRRendererBlockingIssue,
} from '../PIRRenderer.types';

const escapePointerToken = (value: string): string =>
  value.replaceAll('~', '~0').replaceAll('/', '~1');

const sameOperation = (
  binding: PIRDataOperationBinding,
  snapshot: DataLifecycleSnapshot
): boolean =>
  binding.operation.documentId === snapshot.operation.documentId &&
  binding.operation.operationId === snapshot.operation.operationId;

export type PIRDocumentDataLifecycleProjection = Readonly<{
  dataById: Readonly<Record<string, unknown>>;
  lifecycleByDataId: Readonly<Record<string, DataLifecycleSnapshot>>;
  issues: readonly PIRRendererBlockingIssue[];
}>;

/** Projects runtime snapshots into one isolated PIR document instance scope. */
export const projectPirDocumentDataLifecycle = (input: {
  documentId: string;
  rootNodeId: string;
  instancePath: string;
  bindingsByDataId?: Readonly<Record<string, PIRDataOperationBinding>>;
  rootDataById?: Readonly<Record<string, unknown>>;
  runtime?: PIRDataOperationRuntimePort;
}): PIRDocumentDataLifecycleProjection => {
  const dataById: Record<string, unknown> = { ...(input.rootDataById ?? {}) };
  const lifecycleByDataId: Record<string, DataLifecycleSnapshot> = {};
  const issues: PIRRendererBlockingIssue[] = [];

  for (const [dataId, binding] of Object.entries(
    input.bindingsByDataId ?? {}
  ).sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))) {
    delete dataById[dataId];
    const path = `/documentsById/${escapePointerToken(input.documentId)}/content/logic/dataById/${escapePointerToken(dataId)}`;
    const snapshot = input.runtime?.resolveSnapshot({
      documentId: input.documentId,
      instancePath: input.instancePath,
      dataId,
      binding,
    });
    if (!snapshot) {
      issues.push({
        code: PIR_RENDERER_BLOCKING_ISSUE_CODES.dataLifecycleUnavailable,
        path,
        message: `Data lifecycle snapshot is unavailable for local data binding "${dataId}".`,
        documentId: input.documentId,
        nodeId: input.rootNodeId,
        dataId,
        instancePath: input.instancePath,
      });
      continue;
    }
    if (!sameOperation(binding, snapshot)) {
      issues.push({
        code: PIR_RENDERER_BLOCKING_ISSUE_CODES.dataLifecycleProjectionBlocked,
        causeCode: PIR_COLLECTION_DATA_LIFECYCLE_ISSUE_CODES.operationMismatch,
        path,
        message: `Data lifecycle snapshot for "${dataId}" does not match its durable operation reference.`,
        documentId: input.documentId,
        nodeId: input.rootNodeId,
        dataId,
        instancePath: input.instancePath,
      });
      continue;
    }
    lifecycleByDataId[dataId] = snapshot;
    if (snapshot.status === 'success') dataById[dataId] = snapshot.value;
  }

  return Object.freeze({
    dataById: Object.freeze(dataById),
    lifecycleByDataId: Object.freeze(lifecycleByDataId),
    issues: Object.freeze(issues),
  });
};
