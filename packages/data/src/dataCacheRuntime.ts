import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex, utf8ToBytes } from '@noble/hashes/utils.js';
import {
  DATA_CACHE_POLICY_LIMITS,
  type DataCachePolicy,
  type DataJsonValue,
} from './data.types';
import { cloneDataJsonValue } from './dataJsonRuntime';
import type {
  DataOperationAdapterDescriptor,
  DataOperationAdapterResult,
  DataOperationInvocation,
} from './dataRuntime';

export const DATA_CACHE_RUNTIME_ERROR_CODES = Object.freeze({
  policyInvalid: 'DATA_CACHE_POLICY_INVALID',
  runtimeRequired: 'DATA_CACHE_RUNTIME_REQUIRED',
  keyInputPathInvalid: 'DATA_CACHE_KEY_INPUT_PATH_INVALID',
} as const);
export type DataCacheRuntimeErrorCode =
  (typeof DATA_CACHE_RUNTIME_ERROR_CODES)[keyof typeof DATA_CACHE_RUNTIME_ERROR_CODES];

export class DataCacheRuntimeError extends Error {
  readonly code: DataCacheRuntimeErrorCode;
  readonly retryable = false;

  constructor(code: DataCacheRuntimeErrorCode) {
    super('Data operation cache policy was rejected.');
    this.name = 'DataCacheRuntimeError';
    this.code = code;
  }
}

export const DATA_OPERATION_CACHE_STATUSES = Object.freeze([
  'bypass',
  'bypass-private',
  'hit-fresh',
  'hit-stale',
  'network',
  'network-fallback',
  'network-uncached',
] as const);
export type DataOperationCacheStatus =
  (typeof DATA_OPERATION_CACHE_STATUSES)[number];

export type DataOperationCacheResultMetadata = Readonly<{
  status: DataOperationCacheStatus;
  revalidationRequired?: true;
}>;

export type DataOperationCacheEntry = Readonly<{
  key: string;
  storedAt: number;
  freshUntil: number;
  staleUntil: number;
  result: DataOperationAdapterResult;
}>;

export type DataOperationCacheStore = Readonly<{
  read(
    key: string
  ):
    | DataOperationCacheEntry
    | undefined
    | Promise<DataOperationCacheEntry | undefined>;
  write(entry: DataOperationCacheEntry): void | Promise<void>;
  delete(key: string): void | Promise<void>;
  clear(): void | Promise<void>;
  size(): number | Promise<number>;
}>;

export type DataOperationCachePartition = Readonly<{
  partitionId: string;
}>;

export type DataOperationCacheRuntime = Readonly<{
  store: DataOperationCacheStore;
  targetId: string;
  partition?: DataOperationCachePartition;
}>;

export type DataOperationCachePlan = Readonly<{
  metadata: DataOperationCacheResultMetadata;
  immediate?: DataOperationAdapterResult;
  fallback?: DataOperationAdapterResult;
  write(result: DataOperationAdapterResult, storedAt: number): Promise<boolean>;
}>;

const MAX_CACHE_ENTRIES = 1_000;
const CACHE_KEY_PREFIX = 'data-cache:sha256:';

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

const timestamp = (value: number, label: string): number => {
  if (!Number.isSafeInteger(value) || value < 0)
    throw new TypeError(`${label} must be a non-negative safe integer.`);
  return value;
};

const cloneResult = (
  result: DataOperationAdapterResult
): DataOperationAdapterResult => {
  if (typeof result.empty !== 'boolean')
    throw new TypeError('Data cache result empty must be a boolean.');
  return Object.freeze({
    value: cloneDataJsonValue(result.value),
    empty: result.empty,
    ...(result.page
      ? {
          page: Object.freeze({ ...result.page }),
        }
      : {}),
  });
};

const normalizeEntry = (
  entry: DataOperationCacheEntry,
  expectedKey?: string
): DataOperationCacheEntry => {
  const key = canonical(entry.key, 'Data cache key');
  if (
    !/^data-cache:sha256:[0-9a-f]{64}$/u.test(key) ||
    (expectedKey && key !== expectedKey)
  )
    throw new TypeError('Data cache entry key is invalid.');
  const storedAt = timestamp(entry.storedAt, 'Data cache storedAt');
  const freshUntil = timestamp(entry.freshUntil, 'Data cache freshUntil');
  const staleUntil = timestamp(entry.staleUntil, 'Data cache staleUntil');
  if (freshUntil < storedAt || staleUntil < freshUntil)
    throw new TypeError('Data cache entry lifetime is invalid.');
  return Object.freeze({
    key,
    storedAt,
    freshUntil,
    staleUntil,
    result: cloneResult(entry.result),
  });
};

/** Creates one bounded instance-owned LRU store; cache values never become Workspace state. */
export const createMemoryDataOperationCacheStore = (
  options: Readonly<{ maxEntries?: number }> = {}
): DataOperationCacheStore => {
  const maxEntries = options.maxEntries ?? MAX_CACHE_ENTRIES;
  if (
    !Number.isSafeInteger(maxEntries) ||
    maxEntries < 1 ||
    maxEntries > 10_000
  )
    throw new TypeError('Data cache maxEntries is invalid.');
  const entries = new Map<string, DataOperationCacheEntry>();
  return Object.freeze({
    read(key) {
      const normalizedKey = canonical(key, 'Data cache key');
      const entry = entries.get(normalizedKey);
      if (!entry) return undefined;
      entries.delete(normalizedKey);
      entries.set(normalizedKey, entry);
      return normalizeEntry(entry, normalizedKey);
    },
    write(rawEntry) {
      const entry = normalizeEntry(rawEntry);
      entries.delete(entry.key);
      entries.set(entry.key, entry);
      while (entries.size > maxEntries) {
        const oldest = entries.keys().next().value as string | undefined;
        if (!oldest) break;
        entries.delete(oldest);
      }
    },
    delete(key) {
      entries.delete(canonical(key, 'Data cache key'));
    },
    clear() {
      entries.clear();
    },
    size: () => entries.size,
  });
};

const decodePointerToken = (token: string): string => {
  if (/~(?:[^01]|$)/u.test(token))
    throw new DataCacheRuntimeError(
      DATA_CACHE_RUNTIME_ERROR_CODES.keyInputPathInvalid
    );
  return token.replaceAll('~1', '/').replaceAll('~0', '~');
};

const readJsonPointer = (
  value: DataJsonValue,
  pointer: string
): Readonly<{ found: boolean; value?: DataJsonValue }> => {
  if (pointer === '') return Object.freeze({ found: true, value });
  if (!pointer.startsWith('/'))
    throw new DataCacheRuntimeError(
      DATA_CACHE_RUNTIME_ERROR_CODES.keyInputPathInvalid
    );
  const tokens = pointer.slice(1).split('/').map(decodePointerToken);
  let current: DataJsonValue = value;
  for (const token of tokens) {
    if (Array.isArray(current)) {
      if (!/^(?:0|[1-9][0-9]*)$/u.test(token))
        throw new DataCacheRuntimeError(
          DATA_CACHE_RUNTIME_ERROR_CODES.keyInputPathInvalid
        );
      const index = Number(token);
      if (!Number.isSafeInteger(index) || index >= current.length)
        return Object.freeze({ found: false });
      current = current[index]!;
      continue;
    }
    if (current === null || typeof current !== 'object')
      return Object.freeze({ found: false });
    const record = current as Readonly<Record<string, DataJsonValue>>;
    if (!Object.prototype.hasOwnProperty.call(record, token))
      return Object.freeze({ found: false });
    current = record[token]!;
  }
  return Object.freeze({ found: true, value: current });
};

const selectedCacheInput = (
  input: DataJsonValue,
  paths: readonly string[] | undefined
): unknown => {
  if (!paths) return cloneDataJsonValue(input);
  if (paths.length > DATA_CACHE_POLICY_LIMITS.maxKeyInputPaths)
    throw new DataCacheRuntimeError(
      DATA_CACHE_RUNTIME_ERROR_CODES.policyInvalid
    );
  return [...paths].sort().map((path) => {
    const result = readJsonPointer(input, path);
    return result.found
      ? [path, true, cloneDataJsonValue(result.value!)]
      : [path, false];
  });
};

const stableJson = (value: unknown): string => {
  const sort = (candidate: unknown): unknown => {
    if (candidate === null || typeof candidate !== 'object') return candidate;
    if (Array.isArray(candidate)) return candidate.map(sort);
    return Object.fromEntries(
      Object.entries(candidate as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, entry]) => [key, sort(entry)])
    );
  };
  return JSON.stringify(sort(value));
};

const hasSecretConfiguration = (input: {
  sourceConfiguration: Readonly<Record<string, { kind: string }>>;
  operationConfiguration: Readonly<Record<string, { kind: string }>>;
}): boolean =>
  [
    ...Object.values(input.sourceConfiguration),
    ...Object.values(input.operationConfiguration),
  ].some((value) => value.kind === 'secret-ref');

const cacheDuration = (
  value: number | undefined,
  required: boolean
): number => {
  if (
    value === undefined ||
    !Number.isSafeInteger(value) ||
    value < (required ? 1 : 0) ||
    value > DATA_CACHE_POLICY_LIMITS.maxDurationMs
  )
    throw new DataCacheRuntimeError(
      DATA_CACHE_RUNTIME_ERROR_CODES.policyInvalid
    );
  return value;
};

const bypassPlan = (
  status: 'bypass' | 'bypass-private'
): DataOperationCachePlan =>
  Object.freeze({
    metadata: Object.freeze({ status }),
    write: async () => false,
  });

/** Computes a Secret-free partitioned cache plan without starting adapter or background effects. */
export const createDataOperationCachePlan = async (input: {
  policy: DataCachePolicy | undefined;
  runtime?: DataOperationCacheRuntime;
  invocation: DataOperationInvocation;
  effectiveInput: DataJsonValue;
  adapter: DataOperationAdapterDescriptor;
  sourceAdapterId: string;
  sourceConfiguration: Readonly<Record<string, { kind: string }>>;
  operationConfiguration: Readonly<Record<string, { kind: string }>>;
  now: number;
}): Promise<DataOperationCachePlan> => {
  if (!input.policy || input.policy.strategy === 'no-store')
    return bypassPlan('bypass');
  if (!input.runtime)
    throw new DataCacheRuntimeError(
      DATA_CACHE_RUNTIME_ERROR_CODES.runtimeRequired
    );
  if (hasSecretConfiguration(input) && !input.runtime.partition?.partitionId)
    return bypassPlan('bypass-private');
  const ttlMs = cacheDuration(input.policy.ttlMs, true);
  const staleMs =
    input.policy.strategy === 'cache-first'
      ? 0
      : cacheDuration(input.policy.staleWhileRevalidateMs ?? 0, false);
  if (input.policy.strategy === 'stale-while-revalidate' && staleMs < 1)
    throw new DataCacheRuntimeError(
      DATA_CACHE_RUNTIME_ERROR_CODES.policyInvalid
    );
  if (ttlMs + staleMs > DATA_CACHE_POLICY_LIMITS.maxDurationMs)
    throw new DataCacheRuntimeError(
      DATA_CACHE_RUNTIME_ERROR_CODES.policyInvalid
    );
  const now = timestamp(input.now, 'Data cache plan time');
  const targetId = canonical(input.runtime.targetId, 'Data cache targetId');
  const partitionId = input.runtime.partition
    ? canonical(input.runtime.partition.partitionId, 'Data cache partitionId')
    : null;
  const keyPayload = {
    operation: input.invocation.operation,
    documentRevision: input.invocation.documentRevision,
    input: selectedCacheInput(input.effectiveInput, input.policy.keyInputPaths),
    environment: input.invocation.environment ?? null,
    runtimeZone: input.invocation.runtimeZone,
    mode: input.invocation.mode,
    adapter: {
      sourceId: canonical(input.sourceAdapterId, 'Data source adapter id'),
      implementationId: canonical(input.adapter.id, 'Data adapter id'),
      implementationVersion: canonical(
        input.adapter.version,
        'Data adapter version'
      ),
    },
    targetId,
    partitionId,
  };
  const key = `${CACHE_KEY_PREFIX}${bytesToHex(
    sha256(utf8ToBytes(stableJson(keyPayload)))
  )}`;
  let entry: DataOperationCacheEntry | undefined;
  let storeHealthy = true;
  try {
    const candidate = await input.runtime.store.read(key);
    entry = candidate ? normalizeEntry(candidate, key) : undefined;
  } catch {
    storeHealthy = false;
  }
  if (entry && now >= entry.staleUntil) {
    try {
      await input.runtime.store.delete(key);
    } catch {
      storeHealthy = false;
    }
    entry = undefined;
  }
  const fresh = entry && now < entry.freshUntil ? entry : undefined;
  const stale = entry && !fresh && now < entry.staleUntil ? entry : undefined;
  const immediate =
    input.policy.strategy === 'cache-first'
      ? fresh
      : input.policy.strategy === 'stale-while-revalidate'
        ? (fresh ?? stale)
        : undefined;
  const fallback =
    input.policy.strategy === 'network-first' ? (fresh ?? stale) : undefined;
  const metadata: DataOperationCacheResultMetadata = immediate
    ? Object.freeze({
        status: fresh ? 'hit-fresh' : 'hit-stale',
        ...(!fresh ? { revalidationRequired: true as const } : {}),
      })
    : Object.freeze({ status: storeHealthy ? 'network' : 'network-uncached' });
  return Object.freeze({
    metadata,
    ...(immediate ? { immediate: immediate.result } : {}),
    ...(fallback ? { fallback: fallback.result } : {}),
    async write(result, storedAt) {
      if (!storeHealthy) return false;
      const normalizedStoredAt = timestamp(storedAt, 'Data cache storedAt');
      const freshUntil = normalizedStoredAt + ttlMs;
      const staleUntil = freshUntil + staleMs;
      if (
        !Number.isSafeInteger(freshUntil) ||
        !Number.isSafeInteger(staleUntil)
      )
        throw new DataCacheRuntimeError(
          DATA_CACHE_RUNTIME_ERROR_CODES.policyInvalid
        );
      try {
        await input.runtime!.store.write(
          normalizeEntry({
            key,
            storedAt: normalizedStoredAt,
            freshUntil,
            staleUntil,
            result,
          })
        );
        return true;
      } catch {
        return false;
      }
    },
  });
};
