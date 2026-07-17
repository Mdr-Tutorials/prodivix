import { describe, expect, it } from 'vitest';
import {
  createDataOperationCachePlan,
  createMemoryDataOperationCacheStore,
  type DataOperationCacheRuntime,
} from './dataCacheRuntime';
import { createDataOperationInvocation } from './dataRuntime';

const invocation = createDataOperationInvocation({
  invocationId: 'invocation-1',
  sequence: 1,
  attempt: 1,
  startedAt: 100,
  operation: { documentId: 'data-products', operationId: 'list' },
  documentRevision: 'revision-7',
  runtimeZone: 'client',
  mode: 'live',
  activation: 'route',
  input: { tenant: 'north', page: 1 },
});

const adapter = {
  id: 'core.http',
  version: '1',
  operationKinds: ['query'] as const,
  runtimeZones: ['client'] as const,
  modes: ['live'] as const,
  capabilities: ['network'] as const,
};

const runtime = (
  store = createMemoryDataOperationCacheStore(),
  partitionId = 'principal-session-1'
): DataOperationCacheRuntime => ({
  store,
  targetId: 'browser-preview',
  partition: { partitionId },
});

const createPlan = (input: {
  store?: ReturnType<typeof createMemoryDataOperationCacheStore>;
  now?: number;
  effectiveInput?: typeof invocation.input;
  partitionId?: string;
  strategy?: 'cache-first' | 'network-first' | 'stale-while-revalidate';
  keyInputPaths?: readonly string[];
  ttlMs?: number;
  staleWhileRevalidateMs?: number;
  secret?: boolean;
}) => {
  const strategy = input.strategy ?? 'cache-first';
  const common = {
    ttlMs: input.ttlMs ?? 1_000,
    ...(input.keyInputPaths ? { keyInputPaths: input.keyInputPaths } : {}),
  };
  const policy =
    strategy === 'stale-while-revalidate'
      ? {
          strategy,
          ...common,
          staleWhileRevalidateMs: input.staleWhileRevalidateMs ?? 1_000,
        }
      : strategy === 'network-first'
        ? {
            strategy,
            ...common,
            ...(input.staleWhileRevalidateMs === undefined
              ? {}
              : { staleWhileRevalidateMs: input.staleWhileRevalidateMs }),
          }
        : { strategy, ...common };
  return createDataOperationCachePlan({
    policy,
    runtime: runtime(input.store, input.partitionId ?? 'principal-session-1'),
    invocation,
    effectiveInput: input.effectiveInput ?? invocation.input,
    adapter,
    sourceAdapterId: 'core.http',
    sourceConfiguration: input.secret
      ? { authorization: { kind: 'secret-ref' } }
      : {},
    operationConfiguration: {},
    now: input.now ?? 100,
  });
};

describe('Data cache runtime', () => {
  it('partitions a SHA-256 key by selected input, revision, environment, adapter, target, and principal', async () => {
    const store = createMemoryDataOperationCacheStore();
    const first = await createPlan({
      store,
      keyInputPaths: ['/tenant'],
    });
    expect(first.metadata.status).toBe('network');
    await first.write({ value: ['north'], empty: false }, 100);

    const irrelevantInputChange = await createPlan({
      store,
      keyInputPaths: ['/tenant'],
      effectiveInput: { tenant: 'north', page: 999 },
      now: 101,
    });
    expect(irrelevantInputChange).toMatchObject({
      metadata: { status: 'hit-fresh' },
      immediate: { value: ['north'] },
    });

    const relevantInputChange = await createPlan({
      store,
      keyInputPaths: ['/tenant'],
      effectiveInput: { tenant: 'south', page: 999 },
      now: 101,
    });
    expect(relevantInputChange.immediate).toBeUndefined();
    const otherPrincipal = await createPlan({
      store,
      keyInputPaths: ['/tenant'],
      partitionId: 'principal-session-2',
      now: 101,
    });
    expect(otherPrincipal.immediate).toBeUndefined();
  });

  it('implements cache-first, network-first fallback, and explicit stale revalidation', async () => {
    const store = createMemoryDataOperationCacheStore();
    const initial = await createPlan({
      store,
      strategy: 'stale-while-revalidate',
      ttlMs: 10,
      staleWhileRevalidateMs: 50,
      now: 100,
    });
    await initial.write({ value: ['cached'], empty: false }, 100);

    const fresh = await createPlan({
      store,
      strategy: 'stale-while-revalidate',
      ttlMs: 10,
      staleWhileRevalidateMs: 50,
      now: 109,
    });
    expect(fresh.metadata).toEqual({ status: 'hit-fresh' });

    const stale = await createPlan({
      store,
      strategy: 'stale-while-revalidate',
      ttlMs: 10,
      staleWhileRevalidateMs: 50,
      now: 110,
    });
    expect(stale).toMatchObject({
      metadata: { status: 'hit-stale', revalidationRequired: true },
      immediate: { value: ['cached'] },
    });

    const networkFirst = await createPlan({
      store,
      strategy: 'network-first',
      ttlMs: 10,
      staleWhileRevalidateMs: 50,
      now: 120,
    });
    expect(networkFirst.immediate).toBeUndefined();
    expect(networkFirst.fallback).toEqual({
      value: ['cached'],
      empty: false,
    });

    const expired = await createPlan({
      store,
      strategy: 'cache-first',
      ttlMs: 10,
      now: 160,
    });
    expect(expired.immediate).toBeUndefined();
    expect(await store.size()).toBe(0);
  });

  it('forces authenticated queries to no-store without an opaque principal partition', async () => {
    let touched = false;
    const plan = await createDataOperationCachePlan({
      policy: { strategy: 'cache-first', ttlMs: 1_000 },
      runtime: {
        targetId: 'remote-preview',
        store: {
          read: () => {
            touched = true;
            return undefined;
          },
          write: () => {
            touched = true;
          },
          delete: () => {
            touched = true;
          },
          clear: () => undefined,
          size: () => 0,
        },
      },
      invocation,
      effectiveInput: invocation.input,
      adapter,
      sourceAdapterId: 'core.http',
      sourceConfiguration: { authorization: { kind: 'secret-ref' } },
      operationConfiguration: {},
      now: 100,
    });

    expect(plan.metadata).toEqual({ status: 'bypass-private' });
    expect(await plan.write({ value: ['private'], empty: false }, 100)).toBe(
      false
    );
    expect(touched).toBe(false);
  });

  it('uses exact JSON Pointer semantics and distinguishes missing from null', async () => {
    const store = createMemoryDataOperationCacheStore();
    const missing = await createPlan({
      store,
      keyInputPaths: ['/filter/value'],
      effectiveInput: { filter: {} },
    });
    await missing.write({ value: ['missing'], empty: false }, 100);
    const nullValue = await createPlan({
      store,
      keyInputPaths: ['/filter/value'],
      effectiveInput: { filter: { value: null } },
      now: 101,
    });
    expect(nullValue.immediate).toBeUndefined();

    await expect(
      createPlan({ store, keyInputPaths: ['filter.value'] })
    ).rejects.toMatchObject({ code: 'DATA_CACHE_KEY_INPUT_PATH_INVALID' });
    await expect(
      createPlan({ store, keyInputPaths: ['/filter/~2value'] })
    ).rejects.toMatchObject({ code: 'DATA_CACHE_KEY_INPUT_PATH_INVALID' });
  });

  it('bounds memory entries with deterministic LRU eviction and immutable copies', async () => {
    const store = createMemoryDataOperationCacheStore({ maxEntries: 2 });
    const mutable = { value: ['first'], empty: false };
    const entries = ['1', '2', '3'].map((suffix, index) => ({
      key: `data-cache:sha256:${suffix.repeat(64)}`,
      storedAt: index,
      freshUntil: 100,
      staleUntil: 100,
      result: index === 0 ? mutable : { value: [suffix], empty: false },
    }));
    await store.write(entries[0]!);
    mutable.value[0] = 'mutated';
    await store.write(entries[1]!);
    expect(await store.read(entries[0]!.key)).toMatchObject({
      result: { value: ['first'] },
    });
    await store.write(entries[2]!);

    expect(await store.read(entries[1]!.key)).toBeUndefined();
    expect(await store.size()).toBe(2);
  });
});
