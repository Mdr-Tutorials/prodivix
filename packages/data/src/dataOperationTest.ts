import type { RuntimeZone } from '@prodivix/runtime-core';
import type { DataJsonValue, DataOperationReference } from './data.types';
import { cloneDataJsonValue } from './dataJsonRuntime';
import {
  createDataOperationInvocation,
  type DataOperationInvocation,
  type ExecuteDataOperationResult,
} from './dataRuntime';

export const DATA_OPERATION_TEST_ISSUE_CODES = Object.freeze({
  resultKindMismatch: 'DATA_TEST_RESULT_KIND_MISMATCH',
  valueMismatch: 'DATA_TEST_VALUE_MISMATCH',
  emptyMismatch: 'DATA_TEST_EMPTY_MISMATCH',
  errorCodeMismatch: 'DATA_TEST_ERROR_CODE_MISMATCH',
} as const);

export type DataOperationTestExpectation =
  | Readonly<{
      kind: 'result';
      value?: DataJsonValue;
      empty?: boolean;
    }>
  | Readonly<{
      kind: 'error';
      code: string;
    }>;

export type DataOperationTestCase = Readonly<{
  id: string;
  operation: DataOperationReference;
  input: DataJsonValue;
  expected: DataOperationTestExpectation;
}>;

export type DataOperationTestIssue = Readonly<{
  code: (typeof DATA_OPERATION_TEST_ISSUE_CODES)[keyof typeof DATA_OPERATION_TEST_ISSUE_CODES];
  message: string;
}>;

export type DataOperationTestReport = Readonly<{
  testId: string;
  operation: DataOperationReference;
  status: 'passed' | 'failed';
  startedAt: number;
  completedAt: number;
  actual:
    | Readonly<{
        kind: 'result';
        value: DataJsonValue;
        empty: boolean;
        networkTraceCount: number;
      }>
    | Readonly<{
        kind: 'error';
        code: string;
      }>;
  issues: readonly DataOperationTestIssue[];
}>;

const canonical = (value: string, label: string): string => {
  if (
    !value ||
    value !== value.trim() ||
    value.includes('\0') ||
    value.length > 4_096
  )
    throw new TypeError(`${label} must be canonical.`);
  return value;
};

const stableJson = (value: DataJsonValue): string => JSON.stringify(value);

const errorCode = (error: unknown): string =>
  error &&
  typeof error === 'object' &&
  'code' in error &&
  typeof (error as { code?: unknown }).code === 'string'
    ? canonical((error as { code: string }).code, 'Data test error code')
    : 'DATA_TEST_UNEXPECTED_ERROR';

/** Runs exactly one deterministic mock-only operation assertion. */
export const runDataOperationTest = async (input: {
  test: DataOperationTestCase;
  runId: string;
  sequence: number;
  documentRevision: string;
  runtimeZone: RuntimeZone;
  execute(
    invocation: DataOperationInvocation
  ): Promise<Pick<ExecuteDataOperationResult, 'result' | 'networkTraces'>>;
  now?: () => number;
}): Promise<DataOperationTestReport> => {
  const now = input.now ?? Date.now;
  const testId = canonical(input.test.id, 'Data test id');
  const runId = canonical(input.runId, 'Data test run id');
  const operation = Object.freeze({
    documentId: canonical(
      input.test.operation.documentId,
      'Data test document id'
    ),
    operationId: canonical(
      input.test.operation.operationId,
      'Data test operation id'
    ),
  });
  const startedAt = now();
  const invocation = createDataOperationInvocation({
    invocationId: `${testId}:${runId}`,
    sequence: input.sequence,
    attempt: 1,
    startedAt,
    operation,
    documentRevision: canonical(
      input.documentRevision,
      'Data test document revision'
    ),
    runtimeZone: input.runtimeZone,
    mode: 'mock',
    activation: 'test',
    trigger: Object.freeze({
      kind: 'test',
      testId,
      dispatchId: runId,
    }),
    input: cloneDataJsonValue(input.test.input),
  });
  const issues: DataOperationTestIssue[] = [];
  let actual: DataOperationTestReport['actual'];
  try {
    const result = await input.execute(invocation);
    actual = Object.freeze({
      kind: 'result',
      value: cloneDataJsonValue(result.result.value),
      empty: result.result.empty,
      networkTraceCount: result.networkTraces.length,
    });
    if (input.test.expected.kind !== 'result') {
      issues.push(
        Object.freeze({
          code: DATA_OPERATION_TEST_ISSUE_CODES.resultKindMismatch,
          message: 'Expected an error but the operation returned a result.',
        })
      );
    } else {
      if (
        input.test.expected.value !== undefined &&
        stableJson(actual.value) !== stableJson(input.test.expected.value)
      )
        issues.push(
          Object.freeze({
            code: DATA_OPERATION_TEST_ISSUE_CODES.valueMismatch,
            message: 'Actual result does not match the exact expected value.',
          })
        );
      if (
        input.test.expected.empty !== undefined &&
        actual.empty !== input.test.expected.empty
      )
        issues.push(
          Object.freeze({
            code: DATA_OPERATION_TEST_ISSUE_CODES.emptyMismatch,
            message: 'Actual empty state does not match the expectation.',
          })
        );
    }
  } catch (error) {
    actual = Object.freeze({ kind: 'error', code: errorCode(error) });
    if (input.test.expected.kind !== 'error')
      issues.push(
        Object.freeze({
          code: DATA_OPERATION_TEST_ISSUE_CODES.resultKindMismatch,
          message: 'Expected a result but the operation returned an error.',
        })
      );
    else if (input.test.expected.code !== actual.code)
      issues.push(
        Object.freeze({
          code: DATA_OPERATION_TEST_ISSUE_CODES.errorCodeMismatch,
          message: 'Actual error code does not match the expectation.',
        })
      );
  }
  return Object.freeze({
    testId,
    operation,
    status: issues.length === 0 ? 'passed' : 'failed',
    startedAt,
    completedAt: now(),
    actual,
    issues: Object.freeze(issues),
  });
};
