import { describe, expect, it } from 'vitest';
import type {
  DataJsonValue,
  DataOptimisticCrudEffectPolicy,
} from './data.types';
import {
  createDataOptimisticCrudPlan,
  createMemoryDataOptimisticProjectionStore,
} from './dataOptimisticRuntime';
import { createDataOperationInvocation } from './dataRuntime';

const target = Object.freeze({
  documentId: 'data-products',
  operationId: 'list',
});

const createRuntime = () => {
  const store = createMemoryDataOptimisticProjectionStore([
    {
      target,
      partitionId: 'products:all',
      version: 4,
      value: [{ id: 'existing', name: 'Existing' }],
    },
  ]);
  return { store, runtime: { store, targetPartitionId: 'products:all' } };
};

const invocation = (sequence: number, input: DataJsonValue) =>
  createDataOperationInvocation({
    invocationId: `mutation-${sequence}`,
    sequence,
    attempt: 1,
    startedAt: 100,
    operation: { documentId: 'data-products', operationId: 'save' },
    documentRevision: '9',
    runtimeZone: 'client',
    mode: 'live',
    activation: 'event',
    input,
  });

const createPolicy: DataOptimisticCrudEffectPolicy = Object.freeze({
  kind: 'crud',
  action: 'create',
  target,
  valueInputPath: '/item',
  valueOutputPath: '/item',
  placement: 'start',
  rollback: 'on-error',
});

describe('Data optimistic CRUD runtime', () => {
  it('applies a version-owned create and reconciles the authoritative entity', async () => {
    const { store, runtime } = createRuntime();
    const plan = await createDataOptimisticCrudPlan({
      policy: createPolicy,
      runtime,
      invocation: invocation(1, { item: { id: 'temporary', name: 'Draft' } }),
    });

    expect(plan.applied).toMatchObject({
      version: 5,
      owner: { invocationId: 'mutation-1', sequence: 1 },
      value: [
        { id: 'temporary', name: 'Draft' },
        { id: 'existing', name: 'Existing' },
      ],
    });
    const settlement = await plan.commit({
      value: { item: { id: 'server-1', name: 'Saved' } },
      empty: false,
    });

    expect(settlement.metadata.status).toBe('committed');
    expect(await store.read(target, 'products:all')).toMatchObject({
      version: 6,
      value: [
        { id: 'server-1', name: 'Saved' },
        { id: 'existing', name: 'Existing' },
      ],
    });
    expect((await store.read(target, 'products:all'))?.owner).toBeUndefined();
  });

  it('restores the inverse snapshot when the adapter effect fails', async () => {
    const { store, runtime } = createRuntime();
    const plan = await createDataOptimisticCrudPlan({
      policy: {
        kind: 'crud',
        action: 'update',
        target,
        entityIdPath: '/id',
        valueInputPath: '/item',
        valueOutputPath: '/item',
        rollback: 'on-error',
      },
      runtime,
      invocation: invocation(1, {
        item: { id: 'existing', name: 'Optimistic' },
      }),
    });

    expect((await plan.rollback()).metadata.status).toBe('rolled-back');
    expect(await store.read(target, 'products:all')).toMatchObject({
      version: 6,
      value: [{ id: 'existing', name: 'Existing' }],
    });
  });

  it('never lets an older rollback overwrite a newer mutation owner', async () => {
    const { store, runtime } = createRuntime();
    const first = await createDataOptimisticCrudPlan({
      policy: createPolicy,
      runtime,
      invocation: invocation(1, { item: { id: 'first' } }),
    });
    const second = await createDataOptimisticCrudPlan({
      policy: createPolicy,
      runtime,
      invocation: invocation(2, { item: { id: 'second' } }),
    });

    expect(await first.rollback()).toMatchObject({
      metadata: {
        status: 'rollback-skipped',
        revalidationRequired: true,
      },
    });
    expect(await store.read(target, 'products:all')).toMatchObject({
      owner: { invocationId: 'mutation-2', sequence: 2 },
      value: [
        { id: 'second' },
        { id: 'first' },
        { id: 'existing', name: 'Existing' },
      ],
    });
    await second.rollback();
  });

  it('fails closed when update identity is missing or ambiguous', async () => {
    const { runtime } = createRuntime();
    await expect(
      createDataOptimisticCrudPlan({
        policy: {
          kind: 'crud',
          action: 'delete',
          target,
          entityIdPath: '/id',
          rollback: 'on-error',
        },
        runtime,
        invocation: invocation(1, { id: 'missing' }),
      })
    ).rejects.toMatchObject({
      code: 'DATA_OPTIMISTIC_ENTITY_IDENTITY_MISSING',
    });
  });
});
