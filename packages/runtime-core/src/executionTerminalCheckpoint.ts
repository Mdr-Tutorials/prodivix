import { utf8ToBytes } from '@noble/hashes/utils.js';
import type { ExecutionProviderDescriptor } from './execution.types';
import {
  EXECUTION_TERMINAL_CHECKPOINT_FORMAT,
  EXECUTION_TERMINAL_CHECKPOINT_VERSION,
  freezeSnapshot,
  normalizeSize,
  terminalCloseReasons,
  type ExecutionTerminalCheckpoint,
  type ExecutionTerminalOutputRecord,
  type ExecutionTerminalSnapshot,
  type InputFingerprint,
} from './executionTerminal';

type RestoreExecutionTerminalCheckpointInput = Readonly<{
  checkpoint: ExecutionTerminalCheckpoint;
  terminalSessionId: string;
  executionId: string;
  jobId: string;
  provider: ExecutionProviderDescriptor;
  capability: 'shell';
  maximumOutputRecords: number;
  maximumRetainedOutputBytes: number;
  maximumInputFingerprints: number;
}>;

const exactRecord = (
  value: unknown,
  allowedKeys: readonly string[],
  requiredKeys: readonly string[],
  label: string
): Record<string, unknown> => {
  if (typeof value !== 'object' || value === null || Array.isArray(value))
    throw new TypeError(`${label} must be an object.`);
  const record = value as Record<string, unknown>;
  const allowed = new Set(allowedKeys);
  if (Object.keys(record).some((key) => !allowed.has(key)))
    throw new TypeError(`${label} contains unsupported fields.`);
  if (
    requiredKeys.some(
      (key) => !Object.prototype.hasOwnProperty.call(record, key)
    )
  )
    throw new TypeError(`${label} is missing required fields.`);
  return record;
};

const safeInteger = (value: unknown, label: string, minimum = 0): number => {
  if (!Number.isSafeInteger(value) || (value as number) < minimum)
    throw new TypeError(`${label} must be a bounded safe integer.`);
  return value as number;
};

const finiteTimestamp = (value: unknown, label: string): number => {
  if (typeof value !== 'number' || !Number.isFinite(value))
    throw new TypeError(`${label} must be a finite timestamp.`);
  return value;
};

const exactString = (
  value: unknown,
  expected: string,
  label: string
): string => {
  if (value !== expected) throw new TypeError(`${label} does not match.`);
  return expected;
};

const decodeSnapshot = (
  value: unknown,
  input: RestoreExecutionTerminalCheckpointInput
): ExecutionTerminalSnapshot => {
  const record = exactRecord(
    value,
    [
      'terminalSessionId',
      'executionId',
      'jobId',
      'providerId',
      'providerVersion',
      'capability',
      'status',
      'revision',
      'size',
      'openedAt',
      'updatedAt',
      'leaseExpiresAt',
      'latestOutputCursor',
      'earliestRetainedOutputCursor',
      'retainedOutputBytes',
      'droppedOutputRecords',
      'droppedOutputBytes',
      'latestClientSequence',
      'closedAt',
      'closeReason',
      'exitCode',
    ],
    [
      'terminalSessionId',
      'executionId',
      'jobId',
      'providerId',
      'providerVersion',
      'capability',
      'status',
      'revision',
      'size',
      'openedAt',
      'updatedAt',
      'leaseExpiresAt',
      'latestOutputCursor',
      'earliestRetainedOutputCursor',
      'retainedOutputBytes',
      'droppedOutputRecords',
      'droppedOutputBytes',
      'latestClientSequence',
    ],
    'Execution terminal checkpoint snapshot'
  );
  exactString(
    record.terminalSessionId,
    input.terminalSessionId,
    'Execution terminal checkpoint session id'
  );
  exactString(
    record.executionId,
    input.executionId,
    'Execution terminal checkpoint execution id'
  );
  exactString(
    record.jobId,
    input.jobId,
    'Execution terminal checkpoint job id'
  );
  exactString(
    record.providerId,
    input.provider.id,
    'Execution terminal checkpoint provider id'
  );
  exactString(
    record.providerVersion,
    input.provider.version,
    'Execution terminal checkpoint provider version'
  );
  exactString(
    record.capability,
    input.capability,
    'Execution terminal checkpoint capability'
  );
  if (!['open', 'closing', 'closed'].includes(record.status as string))
    throw new TypeError('Execution terminal checkpoint status is invalid.');
  const status = record.status as ExecutionTerminalSnapshot['status'];
  const openedAt = finiteTimestamp(
    record.openedAt,
    'Execution terminal checkpoint openedAt'
  );
  const updatedAt = finiteTimestamp(
    record.updatedAt,
    'Execution terminal checkpoint updatedAt'
  );
  const leaseExpiresAt = finiteTimestamp(
    record.leaseExpiresAt,
    'Execution terminal checkpoint leaseExpiresAt'
  );
  if (updatedAt < openedAt || leaseExpiresAt <= openedAt)
    throw new TypeError(
      'Execution terminal checkpoint timestamps are invalid.'
    );
  const closeReason = record.closeReason;
  const closedAt = record.closedAt;
  const exitCode = record.exitCode;
  if (
    status === 'closed'
      ? typeof closeReason !== 'string' ||
        !terminalCloseReasons.has(
          closeReason as ExecutionTerminalSnapshot['closeReason'] & string
        ) ||
        typeof closedAt !== 'number' ||
        !Number.isFinite(closedAt) ||
        closedAt < openedAt ||
        closedAt > updatedAt ||
        (exitCode !== undefined && !Number.isSafeInteger(exitCode))
      : closeReason !== undefined ||
        closedAt !== undefined ||
        exitCode !== undefined
  )
    throw new TypeError(
      'Execution terminal checkpoint close state is invalid.'
    );
  const sizeRecord = exactRecord(
    record.size,
    ['columns', 'rows'],
    ['columns', 'rows'],
    'Execution terminal checkpoint size'
  );
  const size = normalizeSize({
    columns: safeInteger(
      sizeRecord.columns,
      'Execution terminal checkpoint columns'
    ),
    rows: safeInteger(sizeRecord.rows, 'Execution terminal checkpoint rows'),
  });
  return freezeSnapshot({
    terminalSessionId: input.terminalSessionId,
    executionId: input.executionId,
    jobId: input.jobId,
    providerId: input.provider.id,
    providerVersion: input.provider.version,
    capability: input.capability,
    status,
    revision: safeInteger(
      record.revision,
      'Execution terminal checkpoint revision',
      1
    ),
    size,
    openedAt,
    updatedAt,
    leaseExpiresAt,
    latestOutputCursor: safeInteger(
      record.latestOutputCursor,
      'Execution terminal checkpoint latest output cursor'
    ),
    earliestRetainedOutputCursor: safeInteger(
      record.earliestRetainedOutputCursor,
      'Execution terminal checkpoint earliest output cursor'
    ),
    retainedOutputBytes: safeInteger(
      record.retainedOutputBytes,
      'Execution terminal checkpoint retained output bytes'
    ),
    droppedOutputRecords: safeInteger(
      record.droppedOutputRecords,
      'Execution terminal checkpoint dropped output records'
    ),
    droppedOutputBytes: safeInteger(
      record.droppedOutputBytes,
      'Execution terminal checkpoint dropped output bytes'
    ),
    latestClientSequence: safeInteger(
      record.latestClientSequence,
      'Execution terminal checkpoint latest client sequence'
    ),
    ...(status === 'closed'
      ? {
          closedAt: closedAt as number,
          closeReason: closeReason as ExecutionTerminalSnapshot['closeReason'] &
            string,
          ...(exitCode === undefined ? {} : { exitCode: exitCode as number }),
        }
      : {}),
  });
};

const decodeOutputs = (
  value: unknown,
  snapshot: ExecutionTerminalSnapshot,
  maximumRecords: number,
  maximumBytes: number
): readonly ExecutionTerminalOutputRecord[] => {
  if (!Array.isArray(value) || value.length > maximumRecords)
    throw new TypeError('Execution terminal checkpoint outputs are invalid.');
  const outputs = value.map((entry, index) => {
    const record = exactRecord(
      entry,
      [
        'terminalSessionId',
        'executionId',
        'jobId',
        'cursor',
        'emittedAt',
        'stream',
        'data',
        'byteLength',
        'redacted',
        'truncated',
      ],
      [
        'terminalSessionId',
        'executionId',
        'jobId',
        'cursor',
        'emittedAt',
        'stream',
        'data',
        'byteLength',
        'redacted',
        'truncated',
      ],
      `Execution terminal checkpoint output ${index}`
    );
    exactString(
      record.terminalSessionId,
      snapshot.terminalSessionId,
      'Execution terminal checkpoint output session id'
    );
    exactString(
      record.executionId,
      snapshot.executionId,
      'Execution terminal checkpoint output execution id'
    );
    exactString(
      record.jobId,
      snapshot.jobId,
      'Execution terminal checkpoint output job id'
    );
    if (record.stream !== 'stdout' && record.stream !== 'stderr')
      throw new TypeError(
        'Execution terminal checkpoint output stream is invalid.'
      );
    if (typeof record.data !== 'string' || !record.data)
      throw new TypeError('Execution terminal checkpoint output is invalid.');
    const byteLength = utf8ToBytes(record.data).byteLength;
    if (
      safeInteger(
        record.byteLength,
        'Execution terminal checkpoint output byteLength'
      ) !== byteLength ||
      typeof record.redacted !== 'boolean' ||
      typeof record.truncated !== 'boolean'
    )
      throw new TypeError(
        'Execution terminal checkpoint output metadata is invalid.'
      );
    const emittedAt = finiteTimestamp(
      record.emittedAt,
      'Execution terminal checkpoint output emittedAt'
    );
    if (emittedAt < snapshot.openedAt || emittedAt > snapshot.updatedAt)
      throw new TypeError(
        'Execution terminal checkpoint output timestamp is invalid.'
      );
    return Object.freeze({
      terminalSessionId: snapshot.terminalSessionId,
      executionId: snapshot.executionId,
      jobId: snapshot.jobId,
      cursor: safeInteger(
        record.cursor,
        'Execution terminal checkpoint output cursor',
        1
      ),
      emittedAt,
      stream: record.stream,
      data: record.data,
      byteLength,
      redacted: record.redacted,
      truncated: record.truncated,
    });
  });
  const retainedBytes = outputs.reduce(
    (total, output) => total + output.byteLength,
    0
  );
  const firstCursor = outputs[0]?.cursor ?? 0;
  if (
    retainedBytes > maximumBytes ||
    retainedBytes !== snapshot.retainedOutputBytes ||
    snapshot.latestOutputCursor !==
      snapshot.droppedOutputRecords + outputs.length ||
    (outputs.length === 0
      ? snapshot.latestOutputCursor !== 0 ||
        snapshot.earliestRetainedOutputCursor !== 0
      : firstCursor !== snapshot.droppedOutputRecords + 1 ||
        snapshot.earliestRetainedOutputCursor !== firstCursor ||
        outputs.at(-1)?.cursor !== snapshot.latestOutputCursor ||
        outputs.some((output, index) => output.cursor !== firstCursor + index))
  )
    throw new TypeError(
      'Execution terminal checkpoint output accounting is invalid.'
    );
  return Object.freeze(outputs);
};

const decodeFingerprints = (
  value: unknown,
  latestClientSequence: number,
  maximumFingerprints: number
): readonly InputFingerprint[] => {
  if (!Array.isArray(value) || value.length > maximumFingerprints)
    throw new TypeError(
      'Execution terminal checkpoint input fingerprints are invalid.'
    );
  const fingerprints = value.map((entry, index) => {
    const record = exactRecord(
      entry,
      ['clientSequence', 'digest'],
      ['clientSequence', 'digest'],
      `Execution terminal checkpoint input fingerprint ${index}`
    );
    if (
      typeof record.digest !== 'string' ||
      !/^[a-f0-9]{64}$/u.test(record.digest)
    )
      throw new TypeError(
        'Execution terminal checkpoint input fingerprint digest is invalid.'
      );
    return Object.freeze({
      clientSequence: safeInteger(
        record.clientSequence,
        'Execution terminal checkpoint input sequence',
        1
      ),
      digest: record.digest,
    });
  });
  const firstSequence = fingerprints[0]?.clientSequence ?? 0;
  if (
    latestClientSequence === 0
      ? fingerprints.length !== 0
      : fingerprints.length === 0 ||
        fingerprints.at(-1)?.clientSequence !== latestClientSequence ||
        firstSequence !== latestClientSequence - fingerprints.length + 1 ||
        fingerprints.some(
          (fingerprint, index) =>
            fingerprint.clientSequence !== firstSequence + index
        )
  )
    throw new TypeError(
      'Execution terminal checkpoint input fingerprint order is invalid.'
    );
  return Object.freeze(fingerprints);
};

/** Strictly restores only a checkpoint produced under the same identity/budgets. */
export const restoreExecutionTerminalCheckpoint = (
  input: RestoreExecutionTerminalCheckpointInput
): ExecutionTerminalCheckpoint => {
  const record = exactRecord(
    input.checkpoint,
    [
      'format',
      'version',
      'limits',
      'snapshot',
      'retainedOutputs',
      'inputFingerprints',
      'fingerprintSalt',
    ],
    [
      'format',
      'version',
      'limits',
      'snapshot',
      'retainedOutputs',
      'inputFingerprints',
      'fingerprintSalt',
    ],
    'Execution terminal checkpoint'
  );
  if (
    record.format !== EXECUTION_TERMINAL_CHECKPOINT_FORMAT ||
    record.version !== EXECUTION_TERMINAL_CHECKPOINT_VERSION
  )
    throw new TypeError('Execution terminal checkpoint format is unsupported.');
  const limits = exactRecord(
    record.limits,
    [
      'maximumOutputRecords',
      'maximumRetainedOutputBytes',
      'maximumInputFingerprints',
    ],
    [
      'maximumOutputRecords',
      'maximumRetainedOutputBytes',
      'maximumInputFingerprints',
    ],
    'Execution terminal checkpoint limits'
  );
  if (
    limits.maximumOutputRecords !== input.maximumOutputRecords ||
    limits.maximumRetainedOutputBytes !== input.maximumRetainedOutputBytes ||
    limits.maximumInputFingerprints !== input.maximumInputFingerprints
  )
    throw new TypeError('Execution terminal checkpoint budgets do not match.');
  if (
    typeof record.fingerprintSalt !== 'string' ||
    !/^[a-f0-9]{64}$/u.test(record.fingerprintSalt)
  )
    throw new TypeError('Execution terminal checkpoint salt is invalid.');
  const snapshot = decodeSnapshot(record.snapshot, input);
  const retainedOutputs = decodeOutputs(
    record.retainedOutputs,
    snapshot,
    input.maximumOutputRecords,
    input.maximumRetainedOutputBytes
  );
  const inputFingerprints = decodeFingerprints(
    record.inputFingerprints,
    snapshot.latestClientSequence,
    input.maximumInputFingerprints
  );
  return Object.freeze({
    format: EXECUTION_TERMINAL_CHECKPOINT_FORMAT,
    version: EXECUTION_TERMINAL_CHECKPOINT_VERSION,
    limits: Object.freeze({
      maximumOutputRecords: input.maximumOutputRecords,
      maximumRetainedOutputBytes: input.maximumRetainedOutputBytes,
      maximumInputFingerprints: input.maximumInputFingerprints,
    }),
    snapshot,
    retainedOutputs,
    inputFingerprints,
    fingerprintSalt: record.fingerprintSalt,
  });
};
