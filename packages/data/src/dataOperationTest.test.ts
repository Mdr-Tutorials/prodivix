import { describe, expect, it } from 'vitest';
import { runDataOperationTest } from './dataOperationTest';

const test = {
  id: 'list-products',
  operation: { documentId: 'data-catalog', operationId: 'list' },
  input: { page: 1 },
  expected: {
    kind: 'result' as const,
    value: { items: [{ id: 'p1' }] },
    empty: false,
  },
};

describe('Data Test Operation contract', () => {
  it('forces one mock test invocation and reports an exact passing result', async () => {
    const report = await runDataOperationTest({
      test,
      runId: 'run-1',
      sequence: 1,
      documentRevision: 'revision-4',
      runtimeZone: 'client',
      now: (() => {
        let current = 100;
        return () => current++;
      })(),
      async execute(invocation) {
        expect(invocation).toMatchObject({
          mode: 'mock',
          activation: 'test',
          trigger: {
            kind: 'test',
            testId: 'list-products',
            dispatchId: 'run-1',
          },
          attempt: 1,
        });
        return {
          result: { value: { items: [{ id: 'p1' }] }, empty: false },
          networkTraces: [],
        };
      },
    });
    expect(report).toMatchObject({
      status: 'passed',
      actual: { kind: 'result', networkTraceCount: 0 },
      issues: [],
    });
  });

  it('reports deterministic value and error-code assertion failures without throwing', async () => {
    const mismatch = await runDataOperationTest({
      test,
      runId: 'run-mismatch',
      sequence: 1,
      documentRevision: 'revision-4',
      runtimeZone: 'client',
      execute: async () => ({
        result: { value: { items: [] }, empty: true },
        networkTraces: [],
      }),
    });
    expect(mismatch.status).toBe('failed');
    expect(mismatch.issues.map((entry) => entry.code)).toEqual([
      'DATA_TEST_VALUE_MISMATCH',
      'DATA_TEST_EMPTY_MISMATCH',
    ]);

    const error = await runDataOperationTest({
      test: {
        ...test,
        expected: { kind: 'error', code: 'DATA_MOCK_DENIED' },
      },
      runId: 'run-error',
      sequence: 2,
      documentRevision: 'revision-4',
      runtimeZone: 'client',
      execute: async () => {
        throw Object.assign(new Error('safe'), { code: 'DATA_MOCK_DENIED' });
      },
    });
    expect(error).toMatchObject({
      status: 'passed',
      actual: { kind: 'error', code: 'DATA_MOCK_DENIED' },
    });
  });
});
