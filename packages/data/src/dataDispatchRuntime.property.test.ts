import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { createDataOperationDispatchCoordinator } from './dataDispatchRuntime';

describe('Data dispatch properties', () => {
  it('assigns contiguous sequences only to canonically changed query inputs', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.integer(), { minLength: 1, maxLength: 40 }),
        async (values) => {
          const coordinator = createDataOperationDispatchCoordinator({
            resolveOperationKind: () => 'query' as const,
            execute: (invocation) => invocation.sequence,
            now: () => 1,
          });
          const dispatched: number[] = [];
          let previous: number | undefined;
          for (const value of values) {
            const result = await coordinator.dispatch(
              {
                operation: {
                  documentId: 'data-products',
                  operationId: 'list',
                },
                documentRevision: '1',
                runtimeZone: 'client',
                mode: 'mock',
                trigger: {
                  kind: 'input-change',
                  dependencyId: 'filters',
                },
                input: { kind: 'literal', value: { value } },
              },
              undefined
            );
            if (value === previous)
              expect(result.status).toBe('skipped-unchanged');
            else {
              expect(result.status).toBe('dispatched');
              dispatched.push(result.invocation!.sequence);
            }
            previous = value;
          }
          expect(dispatched).toEqual(dispatched.map((_, index) => index + 1));
        }
      ),
      { numRuns: 50 }
    );
  });
});
