import type { ExecutionValue } from './execution.types';
import { cloneExecutionValue } from './executionRequest';
import {
  readExecutionNetworkTraceValue,
  type ExecutionNetworkTrace,
} from './executionNetworkTrace';

export const EXECUTION_DATA_STREAM_OPEN_TYPE =
  'prodivix.execution-data-stream-open.v1' as const;
export const EXECUTION_DATA_STREAM_CANCEL_TYPE =
  'prodivix.execution-data-stream-cancel.v1' as const;
export const EXECUTION_DATA_STREAM_PULL_TYPE =
  'prodivix.execution-data-stream-pull.v1' as const;
export const EXECUTION_DATA_STREAM_MESSAGE_TYPE =
  'prodivix.execution-data-stream.v1' as const;

export const EXECUTION_DATA_STREAM_BRIDGE_LIMITS = Object.freeze({
  maxActiveStreams: 32,
  maxInputBytes: 1024 * 1024,
  maxEventBytes: 256 * 1024,
  maxEvents: 256,
} as const);

export type ExecutionDataStreamInvocation = Readonly<{
  requestId: string;
  documentId: string;
  operationId: string;
  adapterId: 'core.graphql' | 'core.asyncapi';
  invocationId: string;
  sequence: number;
  attempt: 1;
  input: ExecutionValue;
}>;

export type ExecutionDataStreamOpenRequest = ExecutionDataStreamInvocation &
  Readonly<{ type: typeof EXECUTION_DATA_STREAM_OPEN_TYPE }>;

export type ExecutionDataStreamCancellation = Readonly<{
  type: typeof EXECUTION_DATA_STREAM_CANCEL_TYPE;
  requestId: string;
}>;

export type ExecutionDataStreamPull = Readonly<{
  type: typeof EXECUTION_DATA_STREAM_PULL_TYPE;
  requestId: string;
  cursor: number;
}>;

export type ExecutionDataStreamBridgeMessage =
  | Readonly<{
      type: typeof EXECUTION_DATA_STREAM_MESSAGE_TYPE;
      requestId: string;
      phase: 'open';
      network: ExecutionNetworkTrace;
    }>
  | Readonly<{
      type: typeof EXECUTION_DATA_STREAM_MESSAGE_TYPE;
      requestId: string;
      phase: 'event';
      cursor: number;
      value: ExecutionValue;
    }>
  | Readonly<{
      type: typeof EXECUTION_DATA_STREAM_MESSAGE_TYPE;
      requestId: string;
      phase: 'complete';
      cursor: number;
    }>
  | Readonly<{
      type: typeof EXECUTION_DATA_STREAM_MESSAGE_TYPE;
      requestId: string;
      phase: 'error';
      code: string;
      retryable: boolean;
    }>;

const exactRecord = (
  value: unknown,
  required: readonly string[]
): Record<string, unknown> | undefined => {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    return undefined;
  const record = value as Record<string, unknown>;
  const allowed = new Set(required);
  return required.every((key) => Object.hasOwn(record, key)) &&
    Object.keys(record).every((key) => allowed.has(key))
    ? record
    : undefined;
};

const identifier = (value: unknown): string | undefined =>
  typeof value === 'string' &&
  value.length > 0 &&
  value.length <= 512 &&
  value === value.trim() &&
  !value.includes('\0')
    ? value
    : undefined;

const integer = (value: unknown, minimum: number): number | undefined =>
  Number.isSafeInteger(value) && (value as number) >= minimum
    ? (value as number)
    : undefined;

const utf8ByteLength = (value: string): number => {
  let bytes = 0;
  for (let index = 0; index < value.length; index += 1) {
    const codePoint = value.codePointAt(index)!;
    bytes +=
      codePoint <= 0x7f
        ? 1
        : codePoint <= 0x7ff
          ? 2
          : codePoint <= 0xffff
            ? 3
            : 4;
    if (codePoint > 0xffff) index += 1;
  }
  return bytes;
};

const boundedValue = (
  value: unknown,
  maximumBytes: number
): ExecutionValue | undefined => {
  try {
    const cloned = cloneExecutionValue(value as ExecutionValue);
    return utf8ByteLength(JSON.stringify(cloned)) <= maximumBytes
      ? cloned
      : undefined;
  } catch {
    return undefined;
  }
};

const correlationMatches = (
  trace: ExecutionNetworkTrace,
  invocation: ExecutionDataStreamInvocation
): boolean =>
  (trace.runtimeZone === 'server' || trace.runtimeZone === 'edge') &&
  trace.mode === 'live' &&
  trace.adapter === invocation.adapterId &&
  trace.correlation?.kind === 'data-operation' &&
  trace.correlation.documentId === invocation.documentId &&
  trace.correlation.operationId === invocation.operationId &&
  trace.correlation.invocationId === invocation.invocationId &&
  trace.correlation.sequence === invocation.sequence &&
  trace.correlation.attempt === invocation.attempt;

export const readExecutionDataStreamOpenRequest = (
  value: unknown
): ExecutionDataStreamOpenRequest | undefined => {
  const record = exactRecord(value, [
    'type',
    'requestId',
    'documentId',
    'operationId',
    'adapterId',
    'invocationId',
    'sequence',
    'attempt',
    'input',
  ]);
  if (!record || record.type !== EXECUTION_DATA_STREAM_OPEN_TYPE)
    return undefined;
  const requestId = identifier(record.requestId);
  const documentId = identifier(record.documentId);
  const operationId = identifier(record.operationId);
  const adapterId = identifier(record.adapterId);
  const invocationId = identifier(record.invocationId);
  const sequence = integer(record.sequence, 0);
  const input = boundedValue(
    record.input,
    EXECUTION_DATA_STREAM_BRIDGE_LIMITS.maxInputBytes
  );
  if (
    !requestId ||
    !documentId ||
    !operationId ||
    !adapterId ||
    (adapterId !== 'core.graphql' && adapterId !== 'core.asyncapi') ||
    !invocationId ||
    sequence === undefined ||
    record.attempt !== 1 ||
    requestId !== `${invocationId}:stream` ||
    input === undefined
  )
    return undefined;
  return Object.freeze({
    type: EXECUTION_DATA_STREAM_OPEN_TYPE,
    requestId,
    documentId,
    operationId,
    adapterId,
    invocationId,
    sequence,
    attempt: 1,
    input,
  });
};

export const readExecutionDataStreamCancellation = (
  value: unknown
): ExecutionDataStreamCancellation | undefined => {
  const record = exactRecord(value, ['type', 'requestId']);
  const requestId = identifier(record?.requestId);
  return record?.type === EXECUTION_DATA_STREAM_CANCEL_TYPE && requestId
    ? Object.freeze({ type: EXECUTION_DATA_STREAM_CANCEL_TYPE, requestId })
    : undefined;
};

export const readExecutionDataStreamPull = (
  value: unknown
): ExecutionDataStreamPull | undefined => {
  const record = exactRecord(value, ['type', 'requestId', 'cursor']);
  const requestId = identifier(record?.requestId);
  const cursor = integer(record?.cursor, 0);
  return record?.type === EXECUTION_DATA_STREAM_PULL_TYPE &&
    requestId &&
    cursor !== undefined &&
    cursor <= EXECUTION_DATA_STREAM_BRIDGE_LIMITS.maxEvents
    ? Object.freeze({
        type: EXECUTION_DATA_STREAM_PULL_TYPE,
        requestId,
        cursor,
      })
    : undefined;
};

/** Reads one parent-to-frame message and enforces exact cursor continuity. */
export const readExecutionDataStreamBridgeMessage = (
  value: unknown,
  invocation: ExecutionDataStreamInvocation,
  currentCursor = 0
): ExecutionDataStreamBridgeMessage | undefined => {
  if (!Number.isSafeInteger(currentCursor) || currentCursor < 0)
    return undefined;
  if (!value || typeof value !== 'object' || Array.isArray(value))
    return undefined;
  const phase = (value as Record<string, unknown>).phase;
  if (phase === 'open') {
    const record = exactRecord(value, [
      'type',
      'requestId',
      'phase',
      'network',
    ]);
    const network = readExecutionNetworkTraceValue(record?.network);
    return record?.type === EXECUTION_DATA_STREAM_MESSAGE_TYPE &&
      record.requestId === invocation.requestId &&
      network &&
      correlationMatches(network, invocation)
      ? Object.freeze({
          type: EXECUTION_DATA_STREAM_MESSAGE_TYPE,
          requestId: invocation.requestId,
          phase: 'open',
          network,
        })
      : undefined;
  }
  if (phase === 'event') {
    const record = exactRecord(value, [
      'type',
      'requestId',
      'phase',
      'cursor',
      'value',
    ]);
    const cursor = integer(record?.cursor, 1);
    const eventValue = boundedValue(
      record?.value,
      EXECUTION_DATA_STREAM_BRIDGE_LIMITS.maxEventBytes
    );
    return record?.type === EXECUTION_DATA_STREAM_MESSAGE_TYPE &&
      record.requestId === invocation.requestId &&
      cursor === currentCursor + 1 &&
      cursor <= EXECUTION_DATA_STREAM_BRIDGE_LIMITS.maxEvents &&
      eventValue !== undefined
      ? Object.freeze({
          type: EXECUTION_DATA_STREAM_MESSAGE_TYPE,
          requestId: invocation.requestId,
          phase: 'event',
          cursor,
          value: eventValue,
        })
      : undefined;
  }
  if (phase === 'complete') {
    const record = exactRecord(value, ['type', 'requestId', 'phase', 'cursor']);
    return record?.type === EXECUTION_DATA_STREAM_MESSAGE_TYPE &&
      record.requestId === invocation.requestId &&
      record.cursor === currentCursor
      ? Object.freeze({
          type: EXECUTION_DATA_STREAM_MESSAGE_TYPE,
          requestId: invocation.requestId,
          phase: 'complete',
          cursor: currentCursor,
        })
      : undefined;
  }
  if (phase === 'error') {
    const record = exactRecord(value, [
      'type',
      'requestId',
      'phase',
      'code',
      'retryable',
    ]);
    const code = identifier(record?.code);
    return record?.type === EXECUTION_DATA_STREAM_MESSAGE_TYPE &&
      record.requestId === invocation.requestId &&
      code &&
      /^[A-Z][A-Z0-9_]{0,127}$/u.test(code) &&
      typeof record.retryable === 'boolean'
      ? Object.freeze({
          type: EXECUTION_DATA_STREAM_MESSAGE_TYPE,
          requestId: invocation.requestId,
          phase: 'error',
          code,
          retryable: record.retryable,
        })
      : undefined;
  }
  return undefined;
};

export const toExecutionDataStreamOpenMessage = (
  invocation: ExecutionDataStreamInvocation,
  network: ExecutionNetworkTrace
): Extract<ExecutionDataStreamBridgeMessage, { phase: 'open' }> => {
  const message = readExecutionDataStreamBridgeMessage(
    {
      type: EXECUTION_DATA_STREAM_MESSAGE_TYPE,
      requestId: invocation.requestId,
      phase: 'open',
      network,
    },
    invocation
  );
  if (!message || message.phase !== 'open')
    throw new TypeError('Execution Data stream open message is invalid.');
  return message;
};

export const toExecutionDataStreamEventMessage = (
  invocation: ExecutionDataStreamInvocation,
  cursor: number,
  value: ExecutionValue
): Extract<ExecutionDataStreamBridgeMessage, { phase: 'event' }> => {
  const message = readExecutionDataStreamBridgeMessage(
    {
      type: EXECUTION_DATA_STREAM_MESSAGE_TYPE,
      requestId: invocation.requestId,
      phase: 'event',
      cursor,
      value,
    },
    invocation,
    cursor - 1
  );
  if (!message || message.phase !== 'event')
    throw new TypeError('Execution Data stream event message is invalid.');
  return message;
};

export const toExecutionDataStreamTerminalMessage = (
  invocation: ExecutionDataStreamInvocation,
  terminal:
    | Readonly<{ phase: 'complete'; cursor: number }>
    | Readonly<{ phase: 'error'; code: string; retryable: boolean }>
): Extract<
  ExecutionDataStreamBridgeMessage,
  { phase: 'complete' | 'error' }
> => {
  const message = readExecutionDataStreamBridgeMessage(
    {
      type: EXECUTION_DATA_STREAM_MESSAGE_TYPE,
      requestId: invocation.requestId,
      ...terminal,
    },
    invocation,
    terminal.phase === 'complete' ? terminal.cursor : 0
  );
  if (!message || (message.phase !== 'complete' && message.phase !== 'error'))
    throw new TypeError('Execution Data stream terminal message is invalid.');
  return message;
};
