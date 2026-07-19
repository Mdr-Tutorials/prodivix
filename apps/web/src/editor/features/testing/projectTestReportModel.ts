import {
  EXECUTION_TEST_REPORT_TRACE_NAME,
  readExecutionTestReportValue,
  type ExecutionSessionSnapshot,
  type ExecutionTestReport,
  type ExecutionSourceTrace,
} from '@prodivix/runtime-core';
import { resolveExecutionPrimarySourceTrace } from '@/editor/features/execution/executionSourceTraceModel';

export type ProjectTestReportPresentation = Readonly<{
  report: ExecutionTestReport;
  jobId: string;
  providerId: string;
  snapshotId: string;
}>;

/** Test reports never guess between multiple generated/root/helper owners. */
export const resolveProjectTestPrimarySourceTrace = (
  sourceTrace: readonly ExecutionSourceTrace[] | undefined
): ExecutionSourceTrace | undefined =>
  resolveExecutionPrimarySourceTrace(sourceTrace);

/** Reads the latest normalized report from canonical bounded session events. */
export const createProjectTestReportPresentation = (
  session: ExecutionSessionSnapshot | undefined
): ProjectTestReportPresentation | undefined => {
  if (!session) return undefined;
  const activeJobId = session.activeJob?.jobId;
  for (let index = session.events.length - 1; index >= 0; index -= 1) {
    const record = session.events[index]!;
    if (activeJobId && record.jobId !== activeJobId) continue;
    const event = record.event;
    const report =
      event.kind === 'trace' &&
      event.trace.name === EXECUTION_TEST_REPORT_TRACE_NAME
        ? readExecutionTestReportValue(event.trace.detail)
        : undefined;
    if (
      event.kind !== 'trace' ||
      event.trace.name !== EXECUTION_TEST_REPORT_TRACE_NAME ||
      !report
    ) {
      continue;
    }
    return Object.freeze({
      report,
      jobId: record.jobId,
      providerId: record.providerId,
      snapshotId: record.snapshotId,
    });
  }
  return undefined;
};
