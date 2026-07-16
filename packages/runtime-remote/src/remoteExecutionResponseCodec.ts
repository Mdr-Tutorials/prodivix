import type {
  ExecutionCancellationResult,
  ExecutionJobStatus,
} from '@prodivix/runtime-core';
import {
  booleanValue,
  exactRecord,
  normalizedString,
  providerDescriptor,
  safeInteger,
  safeString,
  sha256Digest,
  sourceTraces,
  stringRecord,
} from './remoteExecutionCodecPrimitives';
import type { DecodedRemoteExecutionRequestEnvelope } from './remoteExecutionRequestCodec';
import {
  REMOTE_EXECUTION_ERROR_CODES,
  REMOTE_EXECUTION_OPERATIONS,
  REMOTE_EXECUTION_PROTOCOL,
  REMOTE_EXECUTION_PROTOCOL_VERSIONS,
  type RemoteExecutionArtifactDescriptor,
  type RemoteExecutionArtifactResult,
  type RemoteExecutionCancelResult,
  type RemoteExecutionCreateResult,
  type RemoteExecutionErrorCode,
  type RemoteExecutionFailureEnvelope,
  type RemoteExecutionOperation,
  type RemoteExecutionProtocolVersion,
  type RemoteExecutionRecord,
  type RemoteExecutionResponseEnvelope,
  type RemoteExecutionSuccessEnvelope,
  type RemoteExecutionWireError,
} from './remoteExecutionProtocol.types';

const protocolVersions = new Set<number>(REMOTE_EXECUTION_PROTOCOL_VERSIONS);
const operations = new Set<string>(REMOTE_EXECUTION_OPERATIONS);
const errorCodes = new Set<string>(REMOTE_EXECUTION_ERROR_CODES);
const fixedRetryability: Readonly<
  Partial<Record<RemoteExecutionErrorCode, boolean>>
> = Object.freeze({
  'protocol-version-unsupported': false,
  'invalid-request': false,
  'identity-conflict': false,
  'not-found': false,
  unauthorized: false,
  forbidden: false,
  'quota-exceeded': false,
  unavailable: true,
  timeout: true,
});
const jobStatuses = new Set<ExecutionJobStatus>([
  'queued',
  'starting',
  'running',
  'cancelling',
  'succeeded',
  'failed',
  'cancelled',
  'timed-out',
]);

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

const wireError = (value: unknown): RemoteExecutionWireError => {
  const record = exactRecord(
    value,
    ['code', 'message', 'retryable'],
    ['code', 'message', 'retryable'],
    'Remote execution error'
  );
  const code = normalizedString(record.code, 'Remote execution error code');
  if (!errorCodes.has(code)) {
    throw new TypeError(`Remote execution error code is unsupported: ${code}.`);
  }
  const retryable = booleanValue(
    record.retryable,
    'Remote execution error retryable'
  );
  const requiredRetryability =
    fixedRetryability[code as RemoteExecutionErrorCode];
  if (
    requiredRetryability !== undefined &&
    retryable !== requiredRetryability
  ) {
    throw new TypeError(
      `Remote execution error ${code} has invalid retryability.`
    );
  }
  return Object.freeze({
    code: code as RemoteExecutionErrorCode,
    message: safeString(record.message, 'Remote execution error message'),
    retryable,
  });
};

export const decodeRemoteExecutionResponseEnvelope = (
  value: unknown,
  expected: Readonly<{
    version: RemoteExecutionProtocolVersion;
    messageId: string;
    operation: RemoteExecutionOperation;
  }>
): RemoteExecutionResponseEnvelope => {
  const base = exactRecord(
    value,
    ['protocol', 'version', 'messageId', 'operation', 'ok', 'payload', 'error'],
    ['protocol', 'version', 'messageId', 'operation', 'ok'],
    'Remote execution response envelope'
  );
  if (base.protocol !== REMOTE_EXECUTION_PROTOCOL) {
    throw new TypeError('Remote response protocol identity drifted.');
  }
  const version = protocolVersion(base.version, 'Remote response version');
  const messageId = normalizedString(
    base.messageId,
    'Remote response messageId'
  );
  const operationValue = operation(base.operation, 'Remote response operation');
  if (
    version !== expected.version ||
    messageId !== expected.messageId ||
    operationValue !== expected.operation
  ) {
    throw new TypeError('Remote response correlation identity drifted.');
  }
  const ok = booleanValue(base.ok, 'Remote response ok');
  if (ok) {
    if (base.error !== undefined || base.payload === undefined) {
      throw new TypeError('Remote success response must contain only payload.');
    }
    return Object.freeze({
      protocol: REMOTE_EXECUTION_PROTOCOL,
      version,
      messageId,
      operation: operationValue,
      ok: true,
      payload: base.payload,
    }) as RemoteExecutionSuccessEnvelope;
  }
  if (base.payload !== undefined || base.error === undefined) {
    throw new TypeError('Remote failure response must contain only error.');
  }
  return Object.freeze({
    protocol: REMOTE_EXECUTION_PROTOCOL,
    version,
    messageId,
    operation: operationValue,
    ok: false,
    error: wireError(base.error),
  }) as RemoteExecutionFailureEnvelope;
};

const jobStatus = (value: unknown, label: string): ExecutionJobStatus => {
  const status = normalizedString(value, label) as ExecutionJobStatus;
  if (!jobStatuses.has(status)) throw new TypeError(`${label} is unsupported.`);
  return status;
};

export const decodeRemoteExecutionRecord = (
  value: unknown
): RemoteExecutionRecord => {
  const record = exactRecord(
    value,
    [
      'executionId',
      'requestId',
      'snapshotDigest',
      'provider',
      'status',
      'latestCursor',
      'createdAt',
      'startedAt',
      'completedAt',
    ],
    [
      'executionId',
      'requestId',
      'snapshotDigest',
      'provider',
      'status',
      'latestCursor',
      'createdAt',
    ],
    'Remote execution record'
  );
  return Object.freeze({
    executionId: normalizedString(record.executionId, 'Remote executionId'),
    requestId: normalizedString(record.requestId, 'Remote requestId'),
    snapshotDigest: sha256Digest(
      record.snapshotDigest,
      'Remote snapshot digest'
    ),
    provider: providerDescriptor(record.provider, 'Remote provider descriptor'),
    status: jobStatus(record.status, 'Remote execution status'),
    latestCursor: safeInteger(record.latestCursor, 'Remote latest cursor'),
    createdAt: safeInteger(record.createdAt, 'Remote createdAt'),
    ...(record.startedAt === undefined
      ? {}
      : { startedAt: safeInteger(record.startedAt, 'Remote startedAt') }),
    ...(record.completedAt === undefined
      ? {}
      : { completedAt: safeInteger(record.completedAt, 'Remote completedAt') }),
  });
};

export const decodeRemoteExecutionCreateResult = (
  value: unknown
): RemoteExecutionCreateResult => {
  const record = exactRecord(
    value,
    ['execution'],
    ['execution'],
    'Remote create result'
  );
  return Object.freeze({
    execution: decodeRemoteExecutionRecord(record.execution),
  });
};

export const decodeRemoteExecutionCancelResult = (
  value: unknown
): RemoteExecutionCancelResult => {
  const record = exactRecord(
    value,
    ['executionId', 'cancellationId', 'result'],
    ['executionId', 'cancellationId', 'result'],
    'Remote cancel result'
  );
  const result = exactRecord(
    record.result,
    ['status', 'reason'],
    ['status'],
    'Remote cancellation result'
  );
  const status = normalizedString(result.status, 'Remote cancellation status');
  if (
    ![
      'accepted',
      'already-requested',
      'already-terminal',
      'unsupported',
      'rejected',
    ].includes(status)
  ) {
    throw new TypeError('Remote cancellation status is unsupported.');
  }
  return Object.freeze({
    executionId: normalizedString(
      record.executionId,
      'Remote cancel executionId'
    ),
    cancellationId: normalizedString(
      record.cancellationId,
      'Remote cancellationId'
    ),
    result: Object.freeze({
      status: status as ExecutionCancellationResult['status'],
      ...(result.reason === undefined
        ? {}
        : {
            reason: safeString(
              result.reason,
              'Remote cancellation result reason'
            ),
          }),
    }),
  });
};

const artifactKinds = new Set([
  'file',
  'bundle',
  'report',
  'coverage',
  'screenshot',
  'trace',
  'custom',
]);

const artifactDescriptor = (
  value: unknown
): RemoteExecutionArtifactDescriptor => {
  const record = exactRecord(
    value,
    [
      'artifactId',
      'kind',
      'label',
      'mediaType',
      'size',
      'digest',
      'expiresAt',
      'authorizationScope',
      'sourceTrace',
      'metadata',
    ],
    [
      'artifactId',
      'kind',
      'mediaType',
      'size',
      'digest',
      'expiresAt',
      'authorizationScope',
    ],
    'Remote artifact descriptor'
  );
  const kind = normalizedString(record.kind, 'Remote artifact kind');
  if (!artifactKinds.has(kind)) {
    throw new TypeError('Remote artifact kind is unsupported.');
  }
  return Object.freeze({
    artifactId: normalizedString(record.artifactId, 'Remote artifactId'),
    kind: kind as RemoteExecutionArtifactDescriptor['kind'],
    ...(record.label === undefined
      ? {}
      : { label: safeString(record.label, 'Remote artifact label') }),
    mediaType: normalizedString(record.mediaType, 'Remote artifact mediaType'),
    size: safeInteger(record.size, 'Remote artifact size'),
    digest: sha256Digest(record.digest, 'Remote artifact digest'),
    expiresAt: safeInteger(record.expiresAt, 'Remote artifact expiresAt'),
    authorizationScope: normalizedString(
      record.authorizationScope,
      'Remote artifact authorization scope'
    ),
    ...(record.sourceTrace === undefined
      ? {}
      : {
          sourceTrace: sourceTraces(
            record.sourceTrace,
            'Remote artifact sourceTrace'
          ),
        }),
    ...(record.metadata === undefined
      ? {}
      : {
          metadata: stringRecord(record.metadata, 'Remote artifact metadata'),
        }),
  });
};

export const decodeRemoteExecutionArtifactResult = (
  value: unknown
): RemoteExecutionArtifactResult => {
  const record = exactRecord(
    value,
    ['executionId', 'providerId', 'artifact'],
    ['executionId', 'providerId', 'artifact'],
    'Remote artifact result'
  );
  return Object.freeze({
    executionId: normalizedString(
      record.executionId,
      'Remote artifact executionId'
    ),
    providerId: normalizedString(
      record.providerId,
      'Remote artifact providerId'
    ),
    artifact: artifactDescriptor(record.artifact),
  });
};

export const createRemoteExecutionSuccessEnvelope = (
  request: DecodedRemoteExecutionRequestEnvelope,
  payload: unknown
): RemoteExecutionSuccessEnvelope =>
  Object.freeze({
    protocol: REMOTE_EXECUTION_PROTOCOL,
    version: request.version,
    messageId: request.messageId,
    operation: request.request.operation,
    ok: true,
    payload,
  });

export const createRemoteExecutionFailureEnvelope = (
  request: DecodedRemoteExecutionRequestEnvelope,
  error: RemoteExecutionWireError
): RemoteExecutionFailureEnvelope =>
  Object.freeze({
    protocol: REMOTE_EXECUTION_PROTOCOL,
    version: request.version,
    messageId: request.messageId,
    operation: request.request.operation,
    ok: false,
    error,
  });
