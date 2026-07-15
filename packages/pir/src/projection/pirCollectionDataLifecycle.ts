import type { DataOperationReference } from '@prodivix/authoring';
import type {
  PIRCollectionDataLifecycleMapping,
  PIRDataOperationBinding,
  PIRJsonValue,
} from '../pir.types';
import type { PIRCollectionResolvedState } from './pirCollectionProjection';

export const PIR_COLLECTION_DATA_LIFECYCLE_ISSUE_CODES = Object.freeze({
  operationMismatch: 'PIR_COLLECTION_DATA_OPERATION_MISMATCH',
} as const);

export type PIRCollectionDataLifecycleIssueCode =
  (typeof PIR_COLLECTION_DATA_LIFECYCLE_ISSUE_CODES)[keyof typeof PIR_COLLECTION_DATA_LIFECYCLE_ISSUE_CODES];

export type PIRCollectionDataLifecycleIssue = Readonly<{
  code: PIRCollectionDataLifecycleIssueCode;
  path: string;
  message: string;
}>;

export type PIRCollectionDataLifecycleResolution =
  | Readonly<{
      status: 'ready';
      state: PIRCollectionResolvedState;
      dataId: string;
      value?: PIRJsonValue;
      errorValue?: unknown;
    }>
  | Readonly<{
      status: 'blocked';
      issues: readonly PIRCollectionDataLifecycleIssue[];
    }>;

export type PIRDataOperationLifecycleSnapshot =
  | Readonly<{
      operation: DataOperationReference;
      status: 'idle' | 'loading' | 'empty';
    }>
  | Readonly<{
      operation: DataOperationReference;
      status: 'success';
      value: PIRJsonValue;
    }>
  | Readonly<{
      operation: DataOperationReference;
      status: 'error';
      error: unknown;
    }>;

export type ResolvePIRCollectionDataLifecycleInput = Readonly<{
  binding: PIRDataOperationBinding;
  mapping: PIRCollectionDataLifecycleMapping;
  snapshot: PIRDataOperationLifecycleSnapshot;
}>;

const sameOperation = (
  left: PIRDataOperationBinding['operation'],
  right: DataOperationReference
): boolean =>
  left.documentId === right.documentId &&
  left.operationId === right.operationId;

const ready = (
  dataId: string,
  state: PIRCollectionResolvedState,
  value?: PIRJsonValue,
  errorValue?: unknown
): PIRCollectionDataLifecycleResolution =>
  Object.freeze({
    status: 'ready',
    state,
    dataId,
    ...(value === undefined ? {} : { value }),
    ...(errorValue === undefined ? {} : { errorValue }),
  });

/** Maps an exact Data lifecycle snapshot without inferring state from its value. */
export const resolvePirCollectionDataLifecycle = (
  input: ResolvePIRCollectionDataLifecycleInput
): PIRCollectionDataLifecycleResolution => {
  if (!sameOperation(input.binding.operation, input.snapshot.operation)) {
    return Object.freeze({
      status: 'blocked',
      issues: Object.freeze([
        Object.freeze({
          code: PIR_COLLECTION_DATA_LIFECYCLE_ISSUE_CODES.operationMismatch,
          path: '/snapshot/operation',
          message:
            'Data lifecycle snapshot operation must match the Collection data binding operation.',
        }),
      ]),
    });
  }

  switch (input.snapshot.status) {
    case 'idle':
      return ready(input.mapping.dataId, input.mapping.idle);
    case 'loading':
      return ready(input.mapping.dataId, 'loading');
    case 'success':
      return ready(input.mapping.dataId, 'item', input.snapshot.value);
    case 'empty':
      return ready(input.mapping.dataId, 'empty');
    case 'error':
      return ready(
        input.mapping.dataId,
        'error',
        undefined,
        input.snapshot.error
      );
  }
};
