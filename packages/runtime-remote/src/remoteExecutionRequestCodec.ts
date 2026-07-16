import {
  decodeRemoteExecutionSnapshotSource,
  encodeRemoteExecutionSnapshotSource,
} from './remoteExecutableProjectCodec';
import {
  exactRecord,
  executionRequest,
  normalizedString,
  safeInteger,
  safeString,
} from './remoteExecutionCodecPrimitives';
import {
  REMOTE_EXECUTION_OPERATIONS,
  REMOTE_EXECUTION_PROTOCOL,
  REMOTE_EXECUTION_PROTOCOL_VERSIONS,
  type RemoteExecutionOperation,
  type RemoteExecutionProtocolVersion,
  type RemoteExecutionRequestEnvelope,
  type RemoteExecutionSnapshotSource,
} from './remoteExecutionProtocol.types';

const operations = new Set<string>(REMOTE_EXECUTION_OPERATIONS);
const protocolVersions = new Set<number>(REMOTE_EXECUTION_PROTOCOL_VERSIONS);

const protocolVersion = (
  value: unknown,
  label: string
): RemoteExecutionProtocolVersion => {
  const version = safeInteger(value, label, 1);
  if (!protocolVersions.has(version)) {
    throw new TypeError(`${label} is unsupported: ${version}.`);
  }
  return version as RemoteExecutionProtocolVersion;
};

const operation = (value: unknown, label: string): RemoteExecutionOperation => {
  const decoded = normalizedString(value, label);
  if (!operations.has(decoded)) {
    throw new TypeError(`${label} is unsupported: ${decoded}.`);
  }
  return decoded as RemoteExecutionOperation;
};

export type DecodedRemoteExecutionRequest =
  | Readonly<{
      operation: 'negotiate';
      payload: Readonly<{ supportedVersions: readonly number[] }>;
    }>
  | Readonly<{
      operation: 'create';
      payload: Readonly<{
        request: ReturnType<typeof executionRequest>;
        snapshot: RemoteExecutionSnapshotSource;
      }>;
    }>
  | Readonly<{
      operation: 'get';
      payload: Readonly<{ executionId: string }>;
    }>
  | Readonly<{
      operation: 'cancel';
      payload: Readonly<{
        executionId: string;
        cancellationId: string;
        reason?: string;
      }>;
    }>
  | Readonly<{
      operation: 'events.read';
      payload: Readonly<{
        executionId: string;
        afterCursor: number;
        limit: number;
      }>;
    }>
  | Readonly<{
      operation: 'artifact.resolve';
      payload: Readonly<{ executionId: string; artifactId: string }>;
    }>;

export type DecodedRemoteExecutionRequestEnvelope = Readonly<{
  protocol: typeof REMOTE_EXECUTION_PROTOCOL;
  version: RemoteExecutionProtocolVersion;
  messageId: string;
  request: DecodedRemoteExecutionRequest;
}>;

const executionIdPayload = (value: unknown, label: string) => {
  const record = exactRecord(value, ['executionId'], ['executionId'], label);
  return Object.freeze({
    executionId: normalizedString(record.executionId, `${label}.executionId`),
  });
};

const decodeRequestPayload = (
  operationValue: RemoteExecutionOperation,
  value: unknown
): DecodedRemoteExecutionRequest => {
  switch (operationValue) {
    case 'negotiate': {
      const record = exactRecord(
        value,
        ['supportedVersions'],
        ['supportedVersions'],
        'Remote negotiation request'
      );
      if (!Array.isArray(record.supportedVersions)) {
        throw new TypeError('Remote supportedVersions must be an array.');
      }
      const supportedVersions = Object.freeze(
        [
          ...new Set(
            record.supportedVersions.map((entry) =>
              safeInteger(entry, 'Remote supported version', 1)
            )
          ),
        ].sort((left, right) => left - right)
      );
      if (!supportedVersions.length) {
        throw new TypeError('Remote supportedVersions must not be empty.');
      }
      return Object.freeze({
        operation: operationValue,
        payload: Object.freeze({ supportedVersions }),
      });
    }
    case 'create': {
      const record = exactRecord(
        value,
        ['request', 'snapshot'],
        ['request', 'snapshot'],
        'Remote create request'
      );
      return Object.freeze({
        operation: operationValue,
        payload: Object.freeze({
          request: executionRequest(record.request, 'Remote execution request'),
          snapshot: decodeRemoteExecutionSnapshotSource(record.snapshot),
        }),
      });
    }
    case 'get':
      return Object.freeze({
        operation: operationValue,
        payload: executionIdPayload(value, 'Remote get request'),
      });
    case 'cancel': {
      const record = exactRecord(
        value,
        ['executionId', 'cancellationId', 'reason'],
        ['executionId', 'cancellationId'],
        'Remote cancel request'
      );
      return Object.freeze({
        operation: operationValue,
        payload: Object.freeze({
          executionId: normalizedString(
            record.executionId,
            'Remote cancel executionId'
          ),
          cancellationId: normalizedString(
            record.cancellationId,
            'Remote cancellationId'
          ),
          ...(record.reason === undefined
            ? {}
            : {
                reason: safeString(record.reason, 'Remote cancellation reason'),
              }),
        }),
      });
    }
    case 'events.read': {
      const record = exactRecord(
        value,
        ['executionId', 'afterCursor', 'limit'],
        ['executionId', 'afterCursor', 'limit'],
        'Remote events request'
      );
      const limit = safeInteger(record.limit, 'Remote event limit', 1);
      if (limit > 1_000)
        throw new TypeError('Remote event limit exceeds 1000.');
      return Object.freeze({
        operation: operationValue,
        payload: Object.freeze({
          executionId: normalizedString(
            record.executionId,
            'Remote events executionId'
          ),
          afterCursor: safeInteger(record.afterCursor, 'Remote event cursor'),
          limit,
        }),
      });
    }
    case 'artifact.resolve': {
      const record = exactRecord(
        value,
        ['executionId', 'artifactId'],
        ['executionId', 'artifactId'],
        'Remote artifact request'
      );
      return Object.freeze({
        operation: operationValue,
        payload: Object.freeze({
          executionId: normalizedString(
            record.executionId,
            'Remote artifact executionId'
          ),
          artifactId: normalizedString(record.artifactId, 'Remote artifactId'),
        }),
      });
    }
  }
};

export const decodeRemoteExecutionRequestEnvelope = (
  value: unknown
): DecodedRemoteExecutionRequestEnvelope => {
  const record = exactRecord(
    value,
    ['protocol', 'version', 'messageId', 'operation', 'payload'],
    ['protocol', 'version', 'messageId', 'operation', 'payload'],
    'Remote execution request envelope'
  );
  if (record.protocol !== REMOTE_EXECUTION_PROTOCOL) {
    throw new TypeError('Remote execution protocol identity is unsupported.');
  }
  const decodedOperation = operation(record.operation, 'Remote operation');
  return Object.freeze({
    protocol: REMOTE_EXECUTION_PROTOCOL,
    version: protocolVersion(record.version, 'Remote protocol version'),
    messageId: normalizedString(record.messageId, 'Remote messageId'),
    request: decodeRequestPayload(decodedOperation, record.payload),
  });
};

export const createRemoteExecutionRequestEnvelope = (
  version: RemoteExecutionProtocolVersion,
  messageId: string,
  operationValue: RemoteExecutionOperation,
  payload: unknown
): RemoteExecutionRequestEnvelope => {
  const envelope = Object.freeze({
    protocol: REMOTE_EXECUTION_PROTOCOL,
    version,
    messageId,
    operation: operationValue,
    payload,
  });
  decodeRemoteExecutionRequestEnvelope(envelope);
  return envelope;
};

export const createRemoteExecutionCreatePayload = (input: {
  request: Parameters<typeof executionRequest>[0];
  snapshot: RemoteExecutionSnapshotSource;
}) =>
  Object.freeze({
    request: input.request,
    snapshot: encodeRemoteExecutionSnapshotSource(input.snapshot),
  });
