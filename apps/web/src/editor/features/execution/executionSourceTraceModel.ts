import type { ExecutionSourceTrace } from '@prodivix/runtime-core';

export type ExecutionSourceNavigationInput = Readonly<{
  jobId: string;
  providerId: string;
  snapshotId: string;
  sourceTrace: ExecutionSourceTrace;
}>;

export type ExecutionSourceNavigationResult =
  | Readonly<{ status: 'opened' }>
  | Readonly<{
      status: 'unavailable';
      reason: 'snapshot-stale' | 'source-unavailable';
    }>;

/**
 * Selects a single navigation owner without guessing between root/helper traces.
 * A CodeArtifact span must stay inside the same artifact identity.
 */
export const resolveExecutionPrimarySourceTrace = (
  sourceTrace: readonly ExecutionSourceTrace[] | undefined
): ExecutionSourceTrace | undefined => {
  if (sourceTrace?.length !== 1) return undefined;
  const trace = sourceTrace[0]!;
  if (
    trace.sourceRef.kind === 'code-artifact' &&
    trace.sourceSpan &&
    trace.sourceSpan.artifactId !== trace.sourceRef.artifactId
  ) {
    return undefined;
  }
  return trace;
};
