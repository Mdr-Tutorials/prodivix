import type {
  DataJsonValue,
  DataOperationReference,
  DataOptimisticCrudEffectPolicy,
} from './data.types';
import { cloneDataJsonValue } from './dataJsonRuntime';
import type {
  DataOperationAdapterResult,
  DataOperationInvocation,
} from './dataRuntime';

export const DATA_OPTIMISTIC_RUNTIME_ERROR_CODES = Object.freeze({
  runtimeRequired: 'DATA_OPTIMISTIC_RUNTIME_REQUIRED',
  projectionMissing: 'DATA_OPTIMISTIC_PROJECTION_MISSING',
  projectionInvalid: 'DATA_OPTIMISTIC_PROJECTION_INVALID',
  pointerInvalid: 'DATA_OPTIMISTIC_POINTER_INVALID',
  entityIdentityMissing: 'DATA_OPTIMISTIC_ENTITY_IDENTITY_MISSING',
  entityIdentityAmbiguous: 'DATA_OPTIMISTIC_ENTITY_IDENTITY_AMBIGUOUS',
  conflict: 'DATA_OPTIMISTIC_CONFLICT',
} as const);
export type DataOptimisticRuntimeErrorCode =
  (typeof DATA_OPTIMISTIC_RUNTIME_ERROR_CODES)[keyof typeof DATA_OPTIMISTIC_RUNTIME_ERROR_CODES];

export class DataOptimisticRuntimeError extends Error {
  readonly code: DataOptimisticRuntimeErrorCode;
  readonly retryable = false;

  constructor(code: DataOptimisticRuntimeErrorCode) {
    super('Data optimistic effect was rejected.');
    this.name = 'DataOptimisticRuntimeError';
    this.code = code;
  }
}

export type DataOptimisticProjectionOwner = Readonly<{
  invocationId: string;
  sequence: number;
}>;

export type DataOptimisticProjectionSnapshot = Readonly<{
  target: DataOperationReference;
  partitionId: string;
  version: number;
  value: DataJsonValue;
  owner?: DataOptimisticProjectionOwner;
}>;

export type DataOptimisticProjectionWrite = Readonly<{
  target: DataOperationReference;
  partitionId: string;
  expectedVersion: number;
  expectedOwner?: DataOptimisticProjectionOwner;
  value: DataJsonValue;
  owner?: DataOptimisticProjectionOwner;
}>;

export type DataOptimisticProjectionStore = Readonly<{
  read(
    target: DataOperationReference,
    partitionId: string
  ):
    | DataOptimisticProjectionSnapshot
    | undefined
    | Promise<DataOptimisticProjectionSnapshot | undefined>;
  compareAndSwap(
    write: DataOptimisticProjectionWrite
  ):
    | DataOptimisticProjectionSnapshot
    | undefined
    | Promise<DataOptimisticProjectionSnapshot | undefined>;
  clear(): void | Promise<void>;
}>;

export type DataOptimisticRuntime = Readonly<{
  store: DataOptimisticProjectionStore;
  targetPartitionId: string;
}>;

export const DATA_OPTIMISTIC_RESULT_STATUSES = Object.freeze([
  'bypass',
  'applied',
  'committed',
  'rolled-back',
  'reconcile-skipped',
  'rollback-skipped',
] as const);
export type DataOptimisticResultStatus =
  (typeof DATA_OPTIMISTIC_RESULT_STATUSES)[number];

export type DataOptimisticResultMetadata = Readonly<{
  status: DataOptimisticResultStatus;
  baseVersion?: number;
  projectionVersion?: number;
  revalidationRequired?: true;
}>;

export type DataOptimisticSettlement = Readonly<{
  metadata: DataOptimisticResultMetadata;
  snapshot?: DataOptimisticProjectionSnapshot;
}>;

export type DataOptimisticCrudPlan = Readonly<{
  metadata: DataOptimisticResultMetadata;
  applied: DataOptimisticProjectionSnapshot;
  commit(result: DataOperationAdapterResult): Promise<DataOptimisticSettlement>;
  rollback(): Promise<DataOptimisticSettlement>;
}>;

const canonical = (value: string, label: string): string => {
  if (
    typeof value !== 'string' ||
    !value ||
    value !== value.trim() ||
    value.includes('\0') ||
    value.length > 4_096
  )
    throw new TypeError(`${label} must be a canonical string.`);
  return value;
};

const safeVersion = (value: number): number => {
  if (!Number.isSafeInteger(value) || value < 0)
    throw new TypeError('Data optimistic projection version is invalid.');
  return value;
};

const normalizeReference = (
  value: DataOperationReference
): DataOperationReference =>
  Object.freeze({
    documentId: canonical(value.documentId, 'Data document id'),
    operationId: canonical(value.operationId, 'Data operation id'),
  });

const normalizeOwner = (
  value: DataOptimisticProjectionOwner | undefined
): DataOptimisticProjectionOwner | undefined =>
  value
    ? Object.freeze({
        invocationId: canonical(value.invocationId, 'Data invocation id'),
        sequence: safeVersion(value.sequence),
      })
    : undefined;

const sameReference = (
  left: DataOperationReference,
  right: DataOperationReference
): boolean =>
  left.documentId === right.documentId &&
  left.operationId === right.operationId;

const sameOwner = (
  left: DataOptimisticProjectionOwner | undefined,
  right: DataOptimisticProjectionOwner | undefined
): boolean =>
  left?.invocationId === right?.invocationId &&
  left?.sequence === right?.sequence;

const projectionKey = (
  target: DataOperationReference,
  partitionId: string
): string =>
  JSON.stringify([
    canonical(target.documentId, 'Data document id'),
    canonical(target.operationId, 'Data operation id'),
    canonical(partitionId, 'Data optimistic partition id'),
  ]);

const normalizeSnapshot = (
  value: DataOptimisticProjectionSnapshot
): DataOptimisticProjectionSnapshot =>
  Object.freeze({
    target: normalizeReference(value.target),
    partitionId: canonical(value.partitionId, 'Data optimistic partition id'),
    version: safeVersion(value.version),
    value: cloneDataJsonValue(value.value),
    ...(value.owner ? { owner: normalizeOwner(value.owner)! } : {}),
  });

/** Creates an instance-owned compare-and-swap projection store; snapshots remain disposable runtime state. */
export const createMemoryDataOptimisticProjectionStore = (
  initial: readonly DataOptimisticProjectionSnapshot[] = []
): DataOptimisticProjectionStore => {
  const snapshots = new Map<string, DataOptimisticProjectionSnapshot>();
  initial.forEach((candidate) => {
    const snapshot = normalizeSnapshot(candidate);
    const key = projectionKey(snapshot.target, snapshot.partitionId);
    if (snapshots.has(key))
      throw new TypeError('Duplicate Data optimistic projection partition.');
    snapshots.set(key, snapshot);
  });
  return Object.freeze({
    read(target, partitionId) {
      const snapshot = snapshots.get(projectionKey(target, partitionId));
      return snapshot ? normalizeSnapshot(snapshot) : undefined;
    },
    compareAndSwap(rawWrite) {
      const target = normalizeReference(rawWrite.target);
      const partitionId = canonical(
        rawWrite.partitionId,
        'Data optimistic partition id'
      );
      const key = projectionKey(target, partitionId);
      const current = snapshots.get(key);
      if (
        !current ||
        current.version !== safeVersion(rawWrite.expectedVersion) ||
        !sameOwner(current.owner, normalizeOwner(rawWrite.expectedOwner))
      )
        return undefined;
      const nextVersion = current.version + 1;
      if (!Number.isSafeInteger(nextVersion))
        throw new TypeError('Data optimistic projection version overflowed.');
      const next = normalizeSnapshot({
        target,
        partitionId,
        version: nextVersion,
        value: rawWrite.value,
        ...(rawWrite.owner ? { owner: rawWrite.owner } : {}),
      });
      snapshots.set(key, next);
      return normalizeSnapshot(next);
    },
    clear: () => snapshots.clear(),
  });
};

const decodePointerToken = (token: string): string => {
  if (/~(?:[^01]|$)/u.test(token))
    throw new DataOptimisticRuntimeError(
      DATA_OPTIMISTIC_RUNTIME_ERROR_CODES.pointerInvalid
    );
  return token.replaceAll('~1', '/').replaceAll('~0', '~');
};

const readPointer = (value: DataJsonValue, pointer: string): DataJsonValue => {
  if (!pointer.startsWith('/'))
    throw new DataOptimisticRuntimeError(
      DATA_OPTIMISTIC_RUNTIME_ERROR_CODES.pointerInvalid
    );
  let current = value;
  for (const token of pointer.slice(1).split('/').map(decodePointerToken)) {
    if (Array.isArray(current)) {
      if (!/^(?:0|[1-9][0-9]*)$/u.test(token))
        throw new DataOptimisticRuntimeError(
          DATA_OPTIMISTIC_RUNTIME_ERROR_CODES.pointerInvalid
        );
      const index = Number(token);
      if (!Number.isSafeInteger(index) || index >= current.length)
        throw new DataOptimisticRuntimeError(
          DATA_OPTIMISTIC_RUNTIME_ERROR_CODES.pointerInvalid
        );
      current = current[index]!;
      continue;
    }
    if (
      current === null ||
      typeof current !== 'object' ||
      !Object.prototype.hasOwnProperty.call(current, token)
    )
      throw new DataOptimisticRuntimeError(
        DATA_OPTIMISTIC_RUNTIME_ERROR_CODES.pointerInvalid
      );
    current = (current as Readonly<Record<string, DataJsonValue>>)[token]!;
  }
  return cloneDataJsonValue(current);
};

const entityIdentity = (value: DataJsonValue, pointer: string): string => {
  const identity = readPointer(value, pointer);
  if (
    identity === null ||
    (typeof identity !== 'string' && typeof identity !== 'number')
  )
    throw new DataOptimisticRuntimeError(
      DATA_OPTIMISTIC_RUNTIME_ERROR_CODES.entityIdentityMissing
    );
  return JSON.stringify(identity);
};

const ownerFor = (
  invocation: DataOperationInvocation
): DataOptimisticProjectionOwner =>
  Object.freeze({
    invocationId: canonical(invocation.invocationId, 'Data invocation id'),
    sequence: safeVersion(invocation.sequence),
  });

const skippedSettlement = (
  status: 'reconcile-skipped' | 'rollback-skipped'
): DataOptimisticSettlement =>
  Object.freeze({
    metadata: Object.freeze({ status, revalidationRequired: true }),
  });

/** Applies one deterministic optimistic CRUD effect before the adapter effect and returns owner-fenced settlement actions. */
export const createDataOptimisticCrudPlan = async (input: {
  policy: DataOptimisticCrudEffectPolicy;
  runtime?: DataOptimisticRuntime;
  invocation: DataOperationInvocation;
}): Promise<DataOptimisticCrudPlan> => {
  if (!input.runtime)
    throw new DataOptimisticRuntimeError(
      DATA_OPTIMISTIC_RUNTIME_ERROR_CODES.runtimeRequired
    );
  const target = normalizeReference(input.policy.target);
  const partitionId = canonical(
    input.runtime.targetPartitionId,
    'Data optimistic partition id'
  );
  const before = await input.runtime.store.read(target, partitionId);
  if (!before)
    throw new DataOptimisticRuntimeError(
      DATA_OPTIMISTIC_RUNTIME_ERROR_CODES.projectionMissing
    );
  if (
    !sameReference(before.target, target) ||
    before.partitionId !== partitionId
  )
    throw new DataOptimisticRuntimeError(
      DATA_OPTIMISTIC_RUNTIME_ERROR_CODES.projectionInvalid
    );
  if (!Array.isArray(before.value))
    throw new DataOptimisticRuntimeError(
      DATA_OPTIMISTIC_RUNTIME_ERROR_CODES.projectionInvalid
    );
  const owner = ownerFor(input.invocation);
  if (before.owner && before.owner.sequence >= owner.sequence)
    throw new DataOptimisticRuntimeError(
      DATA_OPTIMISTIC_RUNTIME_ERROR_CODES.conflict
    );
  const candidate = input.policy.valueInputPath
    ? readPointer(input.invocation.input, input.policy.valueInputPath)
    : cloneDataJsonValue(input.invocation.input);
  const next = [...before.value] as DataJsonValue[];
  let affectedIndex: number;
  if (input.policy.action === 'create') {
    affectedIndex = input.policy.placement === 'start' ? 0 : next.length;
    next.splice(affectedIndex, 0, candidate);
  } else {
    if (!input.policy.entityIdPath)
      throw new DataOptimisticRuntimeError(
        DATA_OPTIMISTIC_RUNTIME_ERROR_CODES.entityIdentityMissing
      );
    const identity = entityIdentity(candidate, input.policy.entityIdPath);
    const matches = next.flatMap((entry, index) => {
      try {
        return entityIdentity(entry, input.policy.entityIdPath!) === identity
          ? [index]
          : [];
      } catch {
        return [];
      }
    });
    if (matches.length === 0)
      throw new DataOptimisticRuntimeError(
        DATA_OPTIMISTIC_RUNTIME_ERROR_CODES.entityIdentityMissing
      );
    if (matches.length > 1)
      throw new DataOptimisticRuntimeError(
        DATA_OPTIMISTIC_RUNTIME_ERROR_CODES.entityIdentityAmbiguous
      );
    affectedIndex = matches[0]!;
    if (input.policy.action === 'update') next[affectedIndex] = candidate;
    else next.splice(affectedIndex, 1);
  }
  const applied = await input.runtime.store.compareAndSwap({
    target,
    partitionId,
    expectedVersion: before.version,
    ...(before.owner ? { expectedOwner: before.owner } : {}),
    value: next,
    owner,
  });
  if (!applied)
    throw new DataOptimisticRuntimeError(
      DATA_OPTIMISTIC_RUNTIME_ERROR_CODES.conflict
    );
  const metadata: DataOptimisticResultMetadata = Object.freeze({
    status: 'applied',
    baseVersion: before.version,
    projectionVersion: applied.version,
  });
  const settle = async (
    kind: 'commit' | 'rollback',
    result?: DataOperationAdapterResult
  ): Promise<DataOptimisticSettlement> => {
    const current = await input.runtime!.store.read(target, partitionId);
    if (
      !current ||
      current.version !== applied.version ||
      !sameOwner(current.owner, owner)
    )
      return skippedSettlement(
        kind === 'commit' ? 'reconcile-skipped' : 'rollback-skipped'
      );
    let value = before.value;
    if (kind === 'commit') {
      const reconciled = [...(current.value as readonly DataJsonValue[])];
      if (input.policy.action !== 'delete') {
        if (!input.policy.valueOutputPath || !result)
          throw new DataOptimisticRuntimeError(
            DATA_OPTIMISTIC_RUNTIME_ERROR_CODES.pointerInvalid
          );
        if (affectedIndex >= reconciled.length)
          return skippedSettlement('reconcile-skipped');
        reconciled[affectedIndex] = readPointer(
          result.value,
          input.policy.valueOutputPath
        );
      }
      value = reconciled;
    }
    const snapshot = await input.runtime!.store.compareAndSwap({
      target,
      partitionId,
      expectedVersion: current.version,
      expectedOwner: owner,
      value,
    });
    if (!snapshot)
      return skippedSettlement(
        kind === 'commit' ? 'reconcile-skipped' : 'rollback-skipped'
      );
    return Object.freeze({
      metadata: Object.freeze({
        status: kind === 'commit' ? 'committed' : 'rolled-back',
        baseVersion: before.version,
        projectionVersion: snapshot.version,
      }),
      snapshot,
    });
  };
  return Object.freeze({
    metadata,
    applied,
    commit: (result) => settle('commit', result),
    rollback: () => settle('rollback'),
  });
};
