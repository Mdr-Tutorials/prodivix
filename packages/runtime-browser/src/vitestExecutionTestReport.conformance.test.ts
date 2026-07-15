import { describe, expect, it } from 'vitest';
import {
  VITEST_EXECUTION_TEST_REPORT_LIMITS,
  parseVitestExecutionTestReport,
} from './vitestExecutionTestReport';

describe('Vitest execution report conformance', () => {
  it('fails closed before an oversized report can enter execution history', () => {
    const testResults = Array.from(
      { length: VITEST_EXECUTION_TEST_REPORT_LIMITS.maxFiles + 1 },
      (_, index) => ({
        name: `src/file-${index}.test.ts`,
        status: 'passed',
        assertionResults: [
          {
            title: `case ${index}`,
            status: 'passed',
            failureMessages: [],
          },
        ],
      })
    );

    expect(() =>
      parseVitestExecutionTestReport({
        source: JSON.stringify({ success: true, testResults }),
        reportId: 'bounded-report',
        completedAt: 1,
      })
    ).toThrow(
      `Vitest JSON report exceeds the ${VITEST_EXECUTION_TEST_REPORT_LIMITS.maxFiles} file limit.`
    );
  });
});
