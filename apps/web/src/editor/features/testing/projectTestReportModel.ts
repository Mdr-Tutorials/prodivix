import {
  EXECUTION_TEST_REPORT_TRACE_NAME,
  readExecutionTestReportValue,
  type ExecutionSessionSnapshot,
  type ExecutionTestReport,
} from '@prodivix/runtime-core';

export type ProjectTestReportPresentation = Readonly<{
  report: ExecutionTestReport;
  jobId: string;
  snapshotId: string;
}>;

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
      snapshotId: record.snapshotId,
    });
  }
  return undefined;
};
