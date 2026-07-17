import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import {
  createDataOperationCachePlan,
  createMemoryDataOperationCacheStore,
} from './dataCacheRuntime';
import { createDataOperationInvocation } from './dataRuntime';

describe('Data cache runtime properties', () => {
  it('keeps cache identity independent of JSON object insertion order', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.dictionary(
          fc.stringMatching(/^[a-z][a-z0-9]{0,8}$/u),
          fc.oneof(fc.string(), fc.integer(), fc.boolean(), fc.constant(null)),
          { maxKeys: 12 }
        ),
        async (value) => {
          const store = createMemoryDataOperationCacheStore();
          const createPlan = (effectiveInput: typeof value, now: number) =>
            createDataOperationCachePlan({
              policy: { strategy: 'cache-first', ttlMs: 1_000 },
              runtime: {
                store,
                targetId: 'browser-preview',
                partition: { partitionId: 'principal-session-1' },
              },
              invocation: createDataOperationInvocation({
                invocationId: 'cache-property',
                sequence: 1,
                attempt: 1,
                startedAt: 100,
                operation: {
                  documentId: 'data-products',
                  operationId: 'list',
                },
                documentRevision: 'revision-7',
                runtimeZone: 'client',
                mode: 'live',
                activation: 'route',
                input: effectiveInput,
              }),
              effectiveInput,
              adapter: {
                id: 'core.http',
                version: '1',
                operationKinds: ['query'],
                runtimeZones: ['client'],
                modes: ['live'],
                capabilities: ['network'],
              },
              sourceAdapterId: 'core.http',
              sourceConfiguration: {},
              operationConfiguration: {},
              now,
            });
          const first = await createPlan(value, 100);
          await first.write({ value: ['cached'], empty: false }, 100);
          const reordered = Object.fromEntries(Object.entries(value).reverse());
          const second = await createPlan(reordered, 101);
          expect(second.metadata.status).toBe('hit-fresh');
        }
      ),
      { numRuns: 40, seed: 0x20_07_2026 }
    );
  });
});
