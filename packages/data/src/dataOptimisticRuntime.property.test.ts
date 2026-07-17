import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import {
  createDataOptimisticCrudPlan,
  createMemoryDataOptimisticProjectionStore,
} from './dataOptimisticRuntime';
import { createDataOperationInvocation } from './dataRuntime';

describe('Data optimistic concurrency properties', () => {
  it('never lets an older inverse patch change a newer owned projection', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 24 }),
        fc.string({ minLength: 1, maxLength: 24 }),
        async (firstId, secondId) => {
          const target = {
            documentId: 'data-products',
            operationId: 'list',
          } as const;
          const store = createMemoryDataOptimisticProjectionStore([
            { target, partitionId: 'all', version: 0, value: [] },
          ]);
          const runtime = { store, targetPartitionId: 'all' } as const;
          const policy = {
            kind: 'crud',
            action: 'create',
            target,
            valueInputPath: '/item',
            valueOutputPath: '/item',
            placement: 'end',
            rollback: 'on-error',
          } as const;
          const createInvocation = (sequence: number, id: string) =>
            createDataOperationInvocation({
              invocationId: `mutation-${sequence}`,
              sequence,
              attempt: 1,
              startedAt: 1,
              operation: {
                documentId: 'data-products',
                operationId: 'create',
              },
              documentRevision: '1',
              runtimeZone: 'client',
              mode: 'live',
              activation: 'event',
              input: { item: { id } },
            });
          const first = await createDataOptimisticCrudPlan({
            policy,
            runtime,
            invocation: createInvocation(1, firstId),
          });
          await createDataOptimisticCrudPlan({
            policy,
            runtime,
            invocation: createInvocation(2, secondId),
          });
          const newer = await store.read(target, 'all');

          expect((await first.rollback()).metadata.status).toBe(
            'rollback-skipped'
          );
          expect(await store.read(target, 'all')).toEqual(newer);
        }
      ),
      { numRuns: 50 }
    );
  });
});
