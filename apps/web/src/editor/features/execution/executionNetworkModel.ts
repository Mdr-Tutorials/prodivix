import {
  EXECUTION_NETWORK_TRACE_NAME,
  readExecutionNetworkTraceValue,
  type ExecutionNetworkTrace,
  type ExecutionSessionSnapshot,
  type ExecutionSourceTrace,
} from '@prodivix/runtime-core';

export type ExecutionNetworkEntry = Readonly<{
  id: string;
  jobId: string;
  providerId: string;
  snapshotId: string;
  trace: ExecutionNetworkTrace;
  sourceTrace?: readonly ExecutionSourceTrace[];
  primarySourceTrace?: ExecutionSourceTrace;
}>;

export type ExecutionNetworkOperationFilter = Readonly<{
  documentId: string;
  operationId: string;
}>;

/** Selects one exact Data operation owner from a sanitized correlated trace. */
export const resolveExecutionNetworkPrimarySourceTrace = (
  trace: ExecutionNetworkTrace,
  sourceTrace: readonly ExecutionSourceTrace[] | undefined
): ExecutionSourceTrace | undefined => {
  if (trace.correlation?.kind !== 'data-operation') return undefined;
  const matches = (sourceTrace ?? []).filter(
    (candidate) =>
      candidate.sourceRef.kind === 'data-operation' &&
      candidate.sourceRef.documentId === trace.correlation!.documentId &&
      candidate.sourceRef.operationId === trace.correlation!.operationId
  );
  return matches.length === 1 ? matches[0] : undefined;
};

/** Projects only strict metadata-only Network traces; malformed or provider-private payloads stay invisible. */
export const createExecutionNetworkEntries = (
  session: ExecutionSessionSnapshot | undefined
): readonly ExecutionNetworkEntry[] => {
  const jobEntries = (session?.events ?? []).flatMap((record) => {
    const event = record.event;
    if (
      event.kind !== 'trace' ||
      event.trace.name !== EXECUTION_NETWORK_TRACE_NAME
    )
      return [];
    const trace = readExecutionNetworkTraceValue(event.trace.detail);
    if (!trace) return [];
    const sourceTrace = event.trace.sourceTrace ?? trace.sourceTrace;
    const primarySourceTrace = resolveExecutionNetworkPrimarySourceTrace(
      trace,
      sourceTrace
    );
    return [
      Object.freeze({
        id: `${record.jobId}:${event.sequence}:${trace.requestId}`,
        jobId: record.jobId,
        providerId: record.providerId,
        snapshotId: record.snapshotId,
        trace,
        ...(sourceTrace ? { sourceTrace } : {}),
        ...(primarySourceTrace ? { primarySourceTrace } : {}),
      }),
    ];
  });
  const observations = (session?.observations ?? []).flatMap((record) => {
    if (record.trace.name !== EXECUTION_NETWORK_TRACE_NAME) return [];
    const trace = readExecutionNetworkTraceValue(record.trace.detail);
    if (!trace) return [];
    const sourceTrace = record.trace.sourceTrace ?? trace.sourceTrace;
    const primarySourceTrace = resolveExecutionNetworkPrimarySourceTrace(
      trace,
      sourceTrace
    );
    return [
      Object.freeze({
        id: `${record.jobId}:observation:${record.sequence}:${trace.requestId}`,
        jobId: record.jobId,
        providerId: record.providerId,
        snapshotId: record.snapshotId,
        trace,
        ...(sourceTrace ? { sourceTrace } : {}),
        ...(primarySourceTrace ? { primarySourceTrace } : {}),
      }),
    ];
  });
  return Object.freeze(
    [...jobEntries, ...observations].sort(
      (left, right) =>
        left.trace.startedAt - right.trace.startedAt ||
        left.id.localeCompare(right.id)
    )
  );
};

export const filterExecutionNetworkEntries = (
  entries: readonly ExecutionNetworkEntry[],
  filter: ExecutionNetworkOperationFilter | undefined
): readonly ExecutionNetworkEntry[] =>
  filter
    ? Object.freeze(
        entries.filter(
          (entry) =>
            entry.trace.correlation?.kind === 'data-operation' &&
            entry.trace.correlation.documentId === filter.documentId &&
            entry.trace.correlation.operationId === filter.operationId
        )
      )
    : entries;
