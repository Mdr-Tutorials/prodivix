import type {
  ExecutionSessionEventRecord,
  ExecutionSessionSnapshot,
} from '@prodivix/runtime-core';

export type ExecutionConsoleFilter = 'all' | 'errors';

export type ExecutionConsoleDiagnostic = Readonly<{
  code: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  path?: string;
}>;

export type ExecutionConsoleLine = Readonly<{
  id: string;
  kind: 'state' | 'log' | 'diagnostic' | 'artifact' | 'trace';
  level: 'info' | 'warning' | 'error';
  label: string;
  message: string;
  detail?: string;
}>;

const serializeDetail = (value: unknown): string | undefined => {
  if (value === undefined) return undefined;
  try {
    const serialized = JSON.stringify(value);
    return serialized.length > 1_500
      ? `${serialized.slice(0, 1_500)}…`
      : serialized;
  } catch {
    return String(value);
  }
};

const eventLine = (
  record: ExecutionSessionEventRecord
): ExecutionConsoleLine => {
  const { event } = record;
  const id = `${record.jobId}:${event.sequence}:${event.kind}`;
  if (event.kind === 'state') {
    const failed =
      event.snapshot.status === 'failed' ||
      event.snapshot.status === 'timed-out';
    return Object.freeze({
      id,
      kind: 'state',
      level: failed ? 'error' : 'info',
      label: 'state',
      message: event.reason
        ? `${event.snapshot.status}: ${event.reason}`
        : event.snapshot.status,
    });
  }
  if (event.kind === 'log') {
    return Object.freeze({
      id,
      kind: 'log',
      level:
        event.log.level === 'warning'
          ? 'warning'
          : event.log.level === 'error'
            ? 'error'
            : 'info',
      label: event.log.stream,
      message: event.log.message,
      ...(event.log.data === undefined
        ? {}
        : { detail: serializeDetail(event.log.data) }),
    });
  }
  if (event.kind === 'diagnostic') {
    return Object.freeze({
      id,
      kind: 'diagnostic',
      level:
        event.diagnostic.severity === 'fatal'
          ? 'error'
          : event.diagnostic.severity,
      label: event.diagnostic.code,
      message: event.diagnostic.message,
      ...(event.diagnostic.sourceSpan
        ? { detail: serializeDetail(event.diagnostic.sourceSpan) }
        : {}),
    });
  }
  if (event.kind === 'artifact') {
    return Object.freeze({
      id,
      kind: 'artifact',
      level: 'info',
      label: event.artifact.kind,
      message:
        event.artifact.label ?? event.artifact.uri ?? event.artifact.artifactId,
      ...(event.artifact.uri ? { detail: event.artifact.uri } : {}),
    });
  }
  return Object.freeze({
    id,
    kind: 'trace',
    level: 'info',
    label: event.trace.phase,
    message: event.trace.name,
    ...(event.trace.detail === undefined
      ? {}
      : { detail: serializeDetail(event.trace.detail) }),
  });
};

export const createExecutionConsoleLines = (input: {
  session?: ExecutionSessionSnapshot;
  diagnostics?: readonly ExecutionConsoleDiagnostic[];
  filter?: ExecutionConsoleFilter;
}): readonly ExecutionConsoleLine[] => {
  const diagnosticLines = (input.diagnostics ?? []).map((diagnostic, index) =>
    Object.freeze({
      id: `preflight:${diagnostic.code}:${index}`,
      kind: 'diagnostic' as const,
      level: diagnostic.severity,
      label: diagnostic.code,
      message: diagnostic.message,
      ...(diagnostic.path ? { detail: diagnostic.path } : {}),
    })
  );
  const lines = [
    ...(input.session?.events.map(eventLine) ?? []),
    ...diagnosticLines,
  ];
  return Object.freeze(
    input.filter === 'errors'
      ? lines.filter((line) => line.level === 'error')
      : lines
  );
};
