import { utf8ToBytes } from '@noble/hashes/utils.js';
import {
  EXECUTION_TERMINAL_LIMITS,
  EXECUTION_TERMINAL_CLOSE_REASONS,
  EXECUTION_TERMINAL_SIGNALS,
  type ExecutionProviderDescriptor,
  type ExecutionSecretTextStreamCheckpoint,
  type ExecutionTerminalCloseReason,
  type ExecutionTerminalCheckpoint,
  type ExecutionTerminalSignal,
} from '@prodivix/runtime-core';
import { providerDescriptor } from './remoteExecutionCodecPrimitives';
import { decodeRemoteExecutionTerminalSize } from './remoteExecutionTerminalCodec';
import {
  decodeRemoteExecutionTerminalExactRecord,
  decodeRemoteExecutionTerminalFinite,
  decodeRemoteExecutionTerminalInteger,
  decodeRemoteExecutionTerminalText,
} from './remoteExecutionTerminalCodecSupport';
import type { RemoteExecutionTerminalCommand } from './remoteExecutionTerminal.types';
import { REMOTE_EXECUTION_TERMINAL_LIMITS } from './remoteExecutionTerminal.types';
import {
  REMOTE_EXECUTION_TERMINAL_STATE_FORMAT,
  REMOTE_EXECUTION_TERMINAL_STATE_LIMITS,
  REMOTE_EXECUTION_TERMINAL_STATE_VERSION,
} from './remoteExecutionTerminalState';

const terminalCloseReasons = new Set(EXECUTION_TERMINAL_CLOSE_REASONS);
const terminalSignals = new Set(EXECUTION_TERMINAL_SIGNALS);

const decodeUtf8 = (value: Uint8Array): string => {
  let output = '';
  for (let index = 0; index < value.length;) {
    const first = value[index]!;
    let codePoint: number;
    let width: number;
    if (first <= 0x7f) {
      codePoint = first;
      width = 1;
    } else if (first >= 0xc2 && first <= 0xdf) {
      codePoint = first & 0x1f;
      width = 2;
    } else if (first >= 0xe0 && first <= 0xef) {
      codePoint = first & 0x0f;
      width = 3;
    } else if (first >= 0xf0 && first <= 0xf4) {
      codePoint = first & 0x07;
      width = 4;
    } else {
      throw new TypeError('Remote Terminal state contains invalid UTF-8.');
    }
    if (index + width > value.length)
      throw new TypeError('Remote Terminal state contains invalid UTF-8.');
    for (let offset = 1; offset < width; offset += 1) {
      const continuation = value[index + offset]!;
      if ((continuation & 0xc0) !== 0x80)
        throw new TypeError('Remote Terminal state contains invalid UTF-8.');
      codePoint = (codePoint << 6) | (continuation & 0x3f);
    }
    if (
      (width === 3 && codePoint < 0x800) ||
      (width === 4 && codePoint < 0x10000) ||
      (codePoint >= 0xd800 && codePoint <= 0xdfff) ||
      codePoint > 0x10ffff
    )
      throw new TypeError('Remote Terminal state contains invalid UTF-8.');
    output += String.fromCodePoint(codePoint);
    index += width;
  }
  return output;
};

export type RemoteExecutionTerminalPortableState = Readonly<{
  format: typeof REMOTE_EXECUTION_TERMINAL_STATE_FORMAT;
  version: typeof REMOTE_EXECUTION_TERMINAL_STATE_VERSION;
  principalSubjectId: string;
  executionId: string;
  terminalSessionId: string;
  workerId: string;
  workerLeaseTokenDigest: string;
  workerAttempt: number;
  provider: ExecutionProviderDescriptor;
  controllerCheckpoint: ExecutionTerminalCheckpoint;
  outputRedactorCheckpoints: Readonly<{
    stdout: ExecutionSecretTextStreamCheckpoint;
    stderr: ExecutionSecretTextStreamCheckpoint;
  }>;
  workerOutputFingerprints: readonly Readonly<{
    workerOutputId: string;
    digest: string;
  }>[];
  accessTokenDigest: string;
  accessTokenExpiresAt: number;
  commandCursor: number;
  acknowledgedCommandCursor: number;
  commandBytes: number;
  commands: readonly RemoteExecutionTerminalCommand[];
}>;

const digest = (value: unknown, label: string, allowEmpty = false): string => {
  if (
    typeof value !== 'string' ||
    ((!allowEmpty || value !== '') && !/^[a-f0-9]{64}$/u.test(value))
  )
    throw new TypeError(`${label} is invalid.`);
  return value;
};

const decodeCommand = (
  value: unknown,
  terminalSessionId: string,
  index: number
): RemoteExecutionTerminalCommand => {
  const base = decodeRemoteExecutionTerminalExactRecord(
    value,
    ['cursor', 'kind', 'terminalSessionId'],
    ['size', 'clientSequence', 'data', 'signal', 'reason']
  );
  const cursor = decodeRemoteExecutionTerminalInteger(
    base.cursor,
    `Remote Terminal state command ${index} cursor`,
    1
  );
  if (base.terminalSessionId !== terminalSessionId)
    throw new TypeError('Remote Terminal state command session is invalid.');
  if (typeof base.kind !== 'string')
    throw new TypeError('Remote Terminal state command kind is invalid.');
  if (base.kind === 'open' || base.kind === 'resize') {
    const record = decodeRemoteExecutionTerminalExactRecord(value, [
      'cursor',
      'kind',
      'terminalSessionId',
      'size',
    ]);
    return Object.freeze({
      cursor,
      kind: base.kind,
      terminalSessionId,
      size: decodeRemoteExecutionTerminalSize(record.size),
    });
  }
  if (base.kind === 'input') {
    const record = decodeRemoteExecutionTerminalExactRecord(value, [
      'cursor',
      'kind',
      'terminalSessionId',
      'clientSequence',
      'data',
    ]);
    if (
      typeof record.data !== 'string' ||
      utf8ToBytes(record.data).byteLength >
        EXECUTION_TERMINAL_LIMITS.maximumInputBytes
    )
      throw new TypeError('Remote Terminal state input command is invalid.');
    return Object.freeze({
      cursor,
      kind: 'input',
      terminalSessionId,
      clientSequence: decodeRemoteExecutionTerminalInteger(
        record.clientSequence,
        'Remote Terminal state command client sequence',
        1
      ),
      data: record.data,
    });
  }
  if (base.kind === 'signal') {
    const record = decodeRemoteExecutionTerminalExactRecord(value, [
      'cursor',
      'kind',
      'terminalSessionId',
      'signal',
    ]);
    if (
      typeof record.signal !== 'string' ||
      !terminalSignals.has(record.signal as ExecutionTerminalSignal)
    )
      throw new TypeError('Remote Terminal state signal command is invalid.');
    return Object.freeze({
      cursor,
      kind: 'signal',
      terminalSessionId,
      signal: record.signal as 'interrupt' | 'terminate',
    });
  }
  if (base.kind === 'close') {
    const record = decodeRemoteExecutionTerminalExactRecord(value, [
      'cursor',
      'kind',
      'terminalSessionId',
      'reason',
    ]);
    if (
      typeof record.reason !== 'string' ||
      !terminalCloseReasons.has(record.reason as ExecutionTerminalCloseReason)
    )
      throw new TypeError('Remote Terminal state close command is invalid.');
    return Object.freeze({
      cursor,
      kind: 'close',
      terminalSessionId,
      reason: record.reason as ExecutionTerminalCloseReason,
    });
  }
  throw new TypeError('Remote Terminal state command kind is unsupported.');
};

export const encodeRemoteExecutionTerminalPortableState = (
  state: RemoteExecutionTerminalPortableState
): Uint8Array => {
  const encoded = utf8ToBytes(JSON.stringify(state));
  if (
    encoded.byteLength >
    REMOTE_EXECUTION_TERMINAL_STATE_LIMITS.maximumPlaintextBytes
  )
    throw new TypeError('Remote Terminal state exceeds its plaintext budget.');
  return encoded;
};

export const decodeRemoteExecutionTerminalPortableState = (
  value: Uint8Array,
  expected: Readonly<{
    executionId: string;
    terminalSessionId: string;
  }>
): RemoteExecutionTerminalPortableState => {
  if (
    !(value instanceof Uint8Array) ||
    value.byteLength === 0 ||
    value.byteLength >
      REMOTE_EXECUTION_TERMINAL_STATE_LIMITS.maximumPlaintextBytes
  )
    throw new TypeError('Remote Terminal state plaintext is invalid.');
  let parsed: unknown;
  try {
    parsed = JSON.parse(decodeUtf8(value));
  } catch {
    throw new TypeError('Remote Terminal state plaintext is invalid.');
  }
  const record = decodeRemoteExecutionTerminalExactRecord(parsed, [
    'format',
    'version',
    'principalSubjectId',
    'executionId',
    'terminalSessionId',
    'workerId',
    'workerLeaseTokenDigest',
    'workerAttempt',
    'provider',
    'controllerCheckpoint',
    'outputRedactorCheckpoints',
    'workerOutputFingerprints',
    'accessTokenDigest',
    'accessTokenExpiresAt',
    'commandCursor',
    'acknowledgedCommandCursor',
    'commandBytes',
    'commands',
  ]);
  if (
    record.format !== REMOTE_EXECUTION_TERMINAL_STATE_FORMAT ||
    record.version !== REMOTE_EXECUTION_TERMINAL_STATE_VERSION ||
    record.executionId !== expected.executionId ||
    record.terminalSessionId !== expected.terminalSessionId
  )
    throw new TypeError('Remote Terminal state identity is invalid.');
  const executionId = decodeRemoteExecutionTerminalText(
    record.executionId,
    'Remote Terminal state execution id'
  );
  const terminalSessionId = decodeRemoteExecutionTerminalText(
    record.terminalSessionId,
    'Remote Terminal state session id'
  );
  const provider = providerDescriptor(
    record.provider,
    'Remote Terminal state provider'
  );
  if (!provider.capabilities.includes('terminal'))
    throw new TypeError('Remote Terminal state provider is invalid.');
  const outputRedactors = decodeRemoteExecutionTerminalExactRecord(
    record.outputRedactorCheckpoints,
    ['stdout', 'stderr']
  );
  if (!Array.isArray(record.workerOutputFingerprints))
    throw new TypeError(
      'Remote Terminal state output fingerprints are invalid.'
    );
  if (
    record.workerOutputFingerprints.length >
    REMOTE_EXECUTION_TERMINAL_LIMITS.maximumOutputFingerprints
  )
    throw new TypeError(
      'Remote Terminal state output fingerprint budget was exceeded.'
    );
  const outputIds = new Set<string>();
  const workerOutputFingerprints = Object.freeze(
    record.workerOutputFingerprints.map((entry, index) => {
      const fingerprint = decodeRemoteExecutionTerminalExactRecord(entry, [
        'workerOutputId',
        'digest',
      ]);
      const workerOutputId = decodeRemoteExecutionTerminalText(
        fingerprint.workerOutputId,
        `Remote Terminal state output fingerprint ${index}`,
        REMOTE_EXECUTION_TERMINAL_LIMITS.maximumWorkerOutputIdLength
      );
      if (outputIds.has(workerOutputId))
        throw new TypeError(
          'Remote Terminal state output fingerprint identity is duplicated.'
        );
      outputIds.add(workerOutputId);
      return Object.freeze({
        workerOutputId,
        digest: digest(
          fingerprint.digest,
          'Remote Terminal state output fingerprint digest'
        ),
      });
    })
  );
  if (!Array.isArray(record.commands))
    throw new TypeError('Remote Terminal state commands are invalid.');
  if (record.commands.length > REMOTE_EXECUTION_TERMINAL_LIMITS.maximumCommands)
    throw new TypeError('Remote Terminal state command budget was exceeded.');
  const commands = Object.freeze(
    record.commands.map((entry, index) =>
      decodeCommand(entry, terminalSessionId, index)
    )
  );
  const commandCursor = decodeRemoteExecutionTerminalInteger(
    record.commandCursor,
    'Remote Terminal state command cursor'
  );
  const acknowledgedCommandCursor = decodeRemoteExecutionTerminalInteger(
    record.acknowledgedCommandCursor,
    'Remote Terminal state acknowledged command cursor'
  );
  const firstCursor = commands[0]?.cursor ?? commandCursor + 1;
  if (
    acknowledgedCommandCursor > commandCursor ||
    commands.some((command, index) => command.cursor !== firstCursor + index) ||
    (commands.length > 0 &&
      (firstCursor !== acknowledgedCommandCursor + 1 ||
        commands.at(-1)?.cursor !== commandCursor))
  )
    throw new TypeError('Remote Terminal state command order is invalid.');
  const storedCommandBytes = decodeRemoteExecutionTerminalInteger(
    record.commandBytes,
    'Remote Terminal state command bytes'
  );
  const exactCommandBytes = commands.reduce(
    (total, command) => total + utf8ToBytes(JSON.stringify(command)).byteLength,
    0
  );
  if (
    storedCommandBytes !== exactCommandBytes ||
    storedCommandBytes > REMOTE_EXECUTION_TERMINAL_LIMITS.maximumCommandBytes
  )
    throw new TypeError('Remote Terminal state command bytes are invalid.');
  const accessTokenDigest = digest(
    record.accessTokenDigest,
    'Remote Terminal state access token digest',
    true
  );
  const accessTokenExpiresAt = decodeRemoteExecutionTerminalFinite(
    record.accessTokenExpiresAt,
    'Remote Terminal state access token expiry'
  );
  if (
    (accessTokenDigest === '' && accessTokenExpiresAt !== 0) ||
    (accessTokenDigest !== '' && accessTokenExpiresAt <= 0)
  )
    throw new TypeError('Remote Terminal state access token is invalid.');
  return Object.freeze({
    format: REMOTE_EXECUTION_TERMINAL_STATE_FORMAT,
    version: REMOTE_EXECUTION_TERMINAL_STATE_VERSION,
    principalSubjectId: decodeRemoteExecutionTerminalText(
      record.principalSubjectId,
      'Remote Terminal state principal subject id'
    ),
    executionId,
    terminalSessionId,
    workerId: decodeRemoteExecutionTerminalText(
      record.workerId,
      'Remote Terminal state worker id'
    ),
    workerLeaseTokenDigest: digest(
      record.workerLeaseTokenDigest,
      'Remote Terminal state worker lease token digest'
    ),
    workerAttempt: decodeRemoteExecutionTerminalInteger(
      record.workerAttempt,
      'Remote Terminal state worker attempt',
      1
    ),
    provider,
    controllerCheckpoint:
      record.controllerCheckpoint as ExecutionTerminalCheckpoint,
    outputRedactorCheckpoints: Object.freeze({
      stdout: outputRedactors.stdout as ExecutionSecretTextStreamCheckpoint,
      stderr: outputRedactors.stderr as ExecutionSecretTextStreamCheckpoint,
    }),
    workerOutputFingerprints,
    accessTokenDigest,
    accessTokenExpiresAt,
    commandCursor,
    acknowledgedCommandCursor,
    commandBytes: storedCommandBytes,
    commands,
  });
};
