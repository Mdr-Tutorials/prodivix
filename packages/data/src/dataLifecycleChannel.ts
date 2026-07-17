import type { DataLifecycleSnapshot } from './data.types';
import type { DataOperationInvocation } from './dataRuntime';

type ActiveDataLifecycleSnapshot = Exclude<
  DataLifecycleSnapshot,
  { status: 'idle' }
>;

export const DATA_INVOCATION_ERROR_CODES = Object.freeze({
  stale: 'DATA_INVOCATION_STALE',
  duplicate: 'DATA_INVOCATION_DUPLICATE',
  superseded: 'DATA_INVOCATION_SUPERSEDED',
  disposed: 'DATA_LIFECYCLE_CHANNEL_DISPOSED',
  identityDrift: 'DATA_LIFECYCLE_IDENTITY_DRIFT',
} as const);

export type DataInvocationErrorCode =
  (typeof DATA_INVOCATION_ERROR_CODES)[keyof typeof DATA_INVOCATION_ERROR_CODES];

export class DataInvocationError extends Error {
  readonly code: DataInvocationErrorCode;
  readonly retryable = false;

  constructor(code: DataInvocationErrorCode) {
    super('Data invocation was rejected by its lifecycle channel.');
    this.name = 'DataInvocationError';
    this.code = code;
  }
}

export type DataLifecycleLease = Readonly<{
  isCurrent(): boolean;
  publish(snapshot: DataLifecycleSnapshot): boolean;
}>;

export type DataLifecycleChannel = Readonly<{
  activate(invocation: DataOperationInvocation): DataLifecycleLease;
  getSnapshot(): DataLifecycleSnapshot | undefined;
  dispose(): void;
}>;

const sameOperation = (
  snapshot: DataLifecycleSnapshot,
  invocation: DataOperationInvocation
): boolean =>
  snapshot.operation.documentId === invocation.operation.documentId &&
  snapshot.operation.operationId === invocation.operation.operationId;

const assertSnapshotIdentity: (
  snapshot: DataLifecycleSnapshot,
  invocation: DataOperationInvocation,
  latestAttempt: number
) => asserts snapshot is ActiveDataLifecycleSnapshot = (
  snapshot,
  invocation,
  latestAttempt
) => {
  if (
    snapshot.status === 'idle' ||
    !sameOperation(snapshot, invocation) ||
    snapshot.sequence !== invocation.sequence ||
    snapshot.invocationId !== invocation.invocationId ||
    snapshot.attempt < invocation.attempt ||
    snapshot.attempt < latestAttempt ||
    snapshot.startedAt !== invocation.startedAt
  )
    throw new TypeError(
      'Data lifecycle snapshot does not match its invocation lease.'
    );
};

/** Owns one document-instance lifecycle and fences duplicate, stale, and superseded invocation results. */
export const createDataLifecycleChannel = (): DataLifecycleChannel => {
  let generation = 0;
  let disposed = false;
  let active:
    | Readonly<{
        sequence: number;
      }>
    | undefined;
  let identity:
    | Readonly<{
        documentId: string;
        operationId: string;
        documentRevision: string;
      }>
    | undefined;
  let snapshot: DataLifecycleSnapshot | undefined;

  return Object.freeze({
    activate(invocation) {
      if (disposed)
        throw new DataInvocationError(DATA_INVOCATION_ERROR_CODES.disposed);
      if (
        identity &&
        (identity.documentId !== invocation.operation.documentId ||
          identity.operationId !== invocation.operation.operationId ||
          identity.documentRevision !== invocation.documentRevision)
      )
        throw new DataInvocationError(
          DATA_INVOCATION_ERROR_CODES.identityDrift
        );
      identity ??= Object.freeze({
        documentId: invocation.operation.documentId,
        operationId: invocation.operation.operationId,
        documentRevision: invocation.documentRevision,
      });
      if (active) {
        if (invocation.sequence < active.sequence)
          throw new DataInvocationError(DATA_INVOCATION_ERROR_CODES.stale);
        if (invocation.sequence === active.sequence)
          throw new DataInvocationError(DATA_INVOCATION_ERROR_CODES.duplicate);
      }

      active = Object.freeze({
        sequence: invocation.sequence,
      });
      const leaseGeneration = ++generation;
      let latestAttempt = invocation.attempt;
      const isCurrent = () => !disposed && generation === leaseGeneration;
      return Object.freeze({
        isCurrent,
        publish(candidate) {
          assertSnapshotIdentity(candidate, invocation, latestAttempt);
          if (!isCurrent()) return false;
          latestAttempt = candidate.attempt;
          snapshot = candidate;
          return true;
        },
      });
    },
    getSnapshot: () => snapshot,
    dispose() {
      if (disposed) return;
      disposed = true;
      generation += 1;
      active = undefined;
      identity = undefined;
      snapshot = undefined;
    },
  });
};
