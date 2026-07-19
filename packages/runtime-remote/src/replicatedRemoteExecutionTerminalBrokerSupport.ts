import {
  createExecutionSecretLeakGuard,
  createExecutionSecretTextStreamRedactor,
  createExecutionTerminalController,
  type ExecutionTerminalCloseReason,
} from '@prodivix/runtime-core';
import type {
  RemoteExecutionPrincipal,
  RemoteExecutionStoredRecord,
} from './remoteExecutionControlPlane.types';
import {
  createRemoteExecutionTerminalTokenDigest as tokenDigest,
  getRemoteExecutionTerminalCommandSize as commandSize,
  hasRemoteExecutionTerminalScope as terminalScopeAllowed,
  normalizeRemoteExecutionTerminalIdentifier as identifier,
  normalizeRemoteExecutionTerminalPositiveInteger as boundedPositiveInteger,
  remoteExecutionTerminalDigestEqual as digestEqual,
  remoteExecutionTerminalActiveStatuses as activeStatuses,
  RemoteExecutionTerminalBrokerError,
  type CreateRemoteExecutionTerminalBrokerOptions,
  type RemoteExecutionTerminalCommandInput,
  type StoredRemoteExecutionTerminal as StoredTerminal,
} from './remoteExecutionTerminalBrokerSupport';
import {
  REMOTE_EXECUTION_TERMINAL_LIMITS,
  REMOTE_EXECUTION_TERMINAL_PROTOCOL,
  REMOTE_EXECUTION_TERMINAL_VERSION,
  type RemoteExecutionTerminalCommand,
  type RemoteExecutionTerminalOpenResult,
  type RemoteExecutionTerminalResolvedExecution,
} from './remoteExecutionTerminal.types';
import {
  decodeRemoteExecutionTerminalPortableState,
  encodeRemoteExecutionTerminalPortableState,
  type RemoteExecutionTerminalPortableState,
} from './remoteExecutionTerminalStateCodec';
import {
  REMOTE_EXECUTION_TERMINAL_STATE_LIMITS,
  RemoteExecutionTerminalStateCipherUnavailableError,
  type RemoteExecutionTerminalStateCipher,
  type RemoteExecutionTerminalStateRecord,
  type RemoteExecutionTerminalStateStore,
} from './remoteExecutionTerminalState';

const sameOrderedValues = <Value>(
  left: readonly Value[],
  right: readonly Value[]
): boolean =>
  left.length === right.length &&
  left.every((value, index) => value === right[index]);

const sameProvider = (
  left: RemoteExecutionStoredRecord['record']['provider'],
  right: RemoteExecutionStoredRecord['record']['provider']
): boolean =>
  left.id === right.id &&
  left.version === right.version &&
  left.displayName === right.displayName &&
  left.isolation === right.isolation &&
  sameOrderedValues(left.profiles, right.profiles) &&
  sameOrderedValues(left.runtimeZones, right.runtimeZones) &&
  sameOrderedValues(left.invocationKinds, right.invocationKinds) &&
  sameOrderedValues(left.capabilities, right.capabilities);

export type CreateReplicatedRemoteExecutionTerminalBrokerOptions =
  CreateRemoteExecutionTerminalBrokerOptions &
    Readonly<{
      stateStore: RemoteExecutionTerminalStateStore;
      stateCipher: RemoteExecutionTerminalStateCipher;
      maximumCompareAndSwapAttempts?: number;
      maximumSweepRecords?: number;
    }>;

export type HydratedReplicatedRemoteExecutionTerminal = Readonly<{
  stored: StoredTerminal;
  state: RemoteExecutionTerminalPortableState;
  initiallyDirty: boolean;
}>;

export type ReplicatedRemoteExecutionTerminalMutation<Result> = Readonly<{
  result: Result;
  stored: StoredTerminal;
  state: RemoteExecutionTerminalPortableState;
  dirty: boolean;
  error?: unknown;
}>;

export const createReplicatedRemoteExecutionTerminalMutation = <Result>(
  input: ReplicatedRemoteExecutionTerminalMutation<Result>
): ReplicatedRemoteExecutionTerminalMutation<Result> => input;

export const createReplicatedRemoteExecutionTerminalBrokerContext = (
  options: CreateReplicatedRemoteExecutionTerminalBrokerOptions
) => {
  const now = options.now ?? Date.now;
  const accessTokenTtlMs = boundedPositiveInteger(
    options.accessTokenTtlMs ??
      REMOTE_EXECUTION_TERMINAL_LIMITS.defaultAccessTokenTtlMs,
    'Remote Terminal access token TTL',
    15 * 60_000
  );
  const maximumSessions = boundedPositiveInteger(
    options.maximumSessions ?? REMOTE_EXECUTION_TERMINAL_LIMITS.maximumSessions,
    'Remote Terminal session budget',
    REMOTE_EXECUTION_TERMINAL_LIMITS.maximumSessions
  );
  const maximumCommands = boundedPositiveInteger(
    options.maximumCommands ?? REMOTE_EXECUTION_TERMINAL_LIMITS.maximumCommands,
    'Remote Terminal command budget',
    REMOTE_EXECUTION_TERMINAL_LIMITS.maximumCommands
  );
  const maximumCommandBytes = boundedPositiveInteger(
    options.maximumCommandBytes ??
      REMOTE_EXECUTION_TERMINAL_LIMITS.maximumCommandBytes,
    'Remote Terminal command byte budget',
    REMOTE_EXECUTION_TERMINAL_LIMITS.maximumCommandBytes
  );
  const maximumCompareAndSwapAttempts = boundedPositiveInteger(
    options.maximumCompareAndSwapAttempts ??
      REMOTE_EXECUTION_TERMINAL_STATE_LIMITS.maximumCompareAndSwapAttempts,
    'Remote Terminal CAS retry budget',
    REMOTE_EXECUTION_TERMINAL_STATE_LIMITS.maximumCompareAndSwapAttempts
  );
  const maximumSweepRecords = boundedPositiveInteger(
    options.maximumSweepRecords ??
      REMOTE_EXECUTION_TERMINAL_STATE_LIMITS.maximumSweepRecords,
    'Remote Terminal sweep record budget',
    REMOTE_EXECUTION_TERMINAL_STATE_LIMITS.maximumSweepRecords
  );
  const secretValues = Object.freeze([...(options.secretValues ?? [])]);
  const outputGuard = createExecutionSecretLeakGuard({ secretValues });

  const readAccessToken = (): Readonly<{ token: string; digest: string }> => {
    const token = identifier(
      options.createAccessToken(),
      'Remote Terminal access token'
    );
    if (
      token.length > REMOTE_EXECUTION_TERMINAL_LIMITS.maximumAccessTokenLength
    )
      throw new TypeError('Remote Terminal access token exceeds its budget.');
    return Object.freeze({ token, digest: tokenDigest(token) });
  };

  const resolveActiveExecution = async (
    executionId: string
  ): Promise<RemoteExecutionTerminalResolvedExecution> => {
    const execution = await options.resolveExecution(
      identifier(executionId, 'Remote Terminal execution id')
    );
    const current = now();
    if (
      !execution?.lease ||
      execution.lease.expiresAt <= current ||
      !activeStatuses.has(execution.record.status) ||
      !execution.record.provider.capabilities.includes('terminal')
    )
      throw new RemoteExecutionTerminalBrokerError(
        'unavailable',
        'Remote Terminal execution is not available.'
      );
    return Object.freeze({ execution, lease: execution.lease });
  };

  const assertPrincipal = (
    principal: RemoteExecutionPrincipal,
    execution: RemoteExecutionStoredRecord
  ): void => {
    if (
      !terminalScopeAllowed(principal) ||
      principal.subjectId !== execution.ownerId
    )
      throw new RemoteExecutionTerminalBrokerError(
        'forbidden',
        'Remote Terminal access is forbidden.'
      );
  };

  const enqueueCommand = (
    stored: StoredTerminal,
    command: RemoteExecutionTerminalCommandInput
  ): void => {
    if (stored.commands.length >= maximumCommands)
      throw new RemoteExecutionTerminalBrokerError(
        'quota-exceeded',
        'Remote Terminal command budget was exceeded.'
      );
    const next = Object.freeze({
      ...command,
      cursor: stored.commandCursor + 1,
    }) as RemoteExecutionTerminalCommand;
    const bytes = commandSize(next);
    if (stored.commandBytes + bytes > maximumCommandBytes)
      throw new RemoteExecutionTerminalBrokerError(
        'quota-exceeded',
        'Remote Terminal command byte budget was exceeded.'
      );
    stored.commandCursor = next.cursor;
    stored.commandBytes += bytes;
    stored.commands.push(next);
  };

  const hydrate = (
    state: RemoteExecutionTerminalPortableState,
    grantExpiresAt: number
  ): HydratedReplicatedRemoteExecutionTerminal => {
    let stored: StoredTerminal;
    const checkpointRevision = state.controllerCheckpoint.snapshot.revision;
    const controller = createExecutionTerminalController({
      terminalSessionId: state.terminalSessionId,
      executionId: state.executionId,
      jobId: state.executionId,
      provider: state.provider,
      capability: 'shell',
      grant: {
        grantId: `worker-lease:${state.workerAttempt}`,
        executionId: state.executionId,
        jobId: state.executionId,
        providerId: state.provider.id,
        expiresAt: grantExpiresAt,
      },
      size: state.controllerCheckpoint.snapshot.size,
      checkpoint: state.controllerCheckpoint,
      requestInput: ({ data, clientSequence }) =>
        enqueueCommand(stored, {
          kind: 'input',
          terminalSessionId: state.terminalSessionId,
          clientSequence,
          data,
        }),
      requestResize: (size) =>
        enqueueCommand(stored, {
          kind: 'resize',
          terminalSessionId: state.terminalSessionId,
          size,
        }),
      requestSignal: (signal) =>
        enqueueCommand(stored, {
          kind: 'signal',
          terminalSessionId: state.terminalSessionId,
          signal,
        }),
      requestClose: (reason) =>
        enqueueCommand(stored, {
          kind: 'close',
          terminalSessionId: state.terminalSessionId,
          reason,
        }),
      secretLeakGuard: outputGuard,
      now,
    });
    stored = {
      principalSubjectId: state.principalSubjectId,
      executionId: state.executionId,
      terminalSessionId: state.terminalSessionId,
      workerId: state.workerId,
      workerLeaseTokenDigest: state.workerLeaseTokenDigest,
      workerAttempt: state.workerAttempt,
      controller,
      outputRedactors: Object.freeze({
        stdout: createExecutionSecretTextStreamRedactor({
          secretValues,
          checkpoint: state.outputRedactorCheckpoints.stdout,
        }),
        stderr: createExecutionSecretTextStreamRedactor({
          secretValues,
          checkpoint: state.outputRedactorCheckpoints.stderr,
        }),
      }),
      workerOutputFingerprints: new Map(
        state.workerOutputFingerprints.map(({ workerOutputId, digest }) => [
          workerOutputId,
          digest,
        ])
      ),
      accessTokenDigest: state.accessTokenDigest,
      accessTokenExpiresAt: state.accessTokenExpiresAt,
      commandCursor: state.commandCursor,
      acknowledgedCommandCursor: state.acknowledgedCommandCursor,
      commandBytes: state.commandBytes,
      commands: [...state.commands],
    };
    return Object.freeze({
      stored,
      state,
      initiallyDirty:
        controller.createCheckpoint().snapshot.revision !== checkpointRevision,
    });
  };

  const toPortableState = (
    state: RemoteExecutionTerminalPortableState,
    stored: StoredTerminal
  ): RemoteExecutionTerminalPortableState =>
    Object.freeze({
      ...state,
      controllerCheckpoint: stored.controller.createCheckpoint(),
      outputRedactorCheckpoints: Object.freeze({
        stdout: stored.outputRedactors.stdout.createCheckpoint(),
        stderr: stored.outputRedactors.stderr.createCheckpoint(),
      }),
      workerOutputFingerprints: Object.freeze(
        [...stored.workerOutputFingerprints].map(([workerOutputId, digest]) =>
          Object.freeze({ workerOutputId, digest })
        )
      ),
      accessTokenDigest: stored.accessTokenDigest,
      accessTokenExpiresAt: stored.accessTokenExpiresAt,
      commandCursor: stored.commandCursor,
      acknowledgedCommandCursor: stored.acknowledgedCommandCursor,
      commandBytes: stored.commandBytes,
      commands: Object.freeze([...stored.commands]),
    });

  const flushOutput = (stored: StoredTerminal): void => {
    (['stdout', 'stderr'] as const).forEach((stream) => {
      const flushed = stored.outputRedactors[stream].flush();
      if (!flushed.value) return;
      stored.controller.emitOutput({
        stream,
        data: flushed.value,
        redacted: flushed.redacted,
      });
    });
  };

  const closeStored = (
    stored: StoredTerminal,
    reason: ExecutionTerminalCloseReason,
    exitCode?: number
  ): void => {
    flushOutput(stored);
    stored.controller.close(reason, exitCode);
    stored.accessTokenDigest = '';
    stored.accessTokenExpiresAt = 0;
    stored.commands = [];
    stored.commandBytes = 0;
  };

  const rotateAccess = (
    stored: StoredTerminal
  ): RemoteExecutionTerminalOpenResult => {
    const access = readAccessToken();
    stored.accessTokenDigest = access.digest;
    stored.accessTokenExpiresAt = now() + accessTokenTtlMs;
    return Object.freeze({
      protocol: REMOTE_EXECUTION_TERMINAL_PROTOCOL,
      version: REMOTE_EXECUTION_TERMINAL_VERSION,
      snapshot: stored.controller.session.getSnapshot(),
      access: Object.freeze({
        token: access.token,
        expiresAt: stored.accessTokenExpiresAt,
      }),
    });
  };

  const recordExpiry = (
    state: RemoteExecutionTerminalPortableState
  ): number => {
    const snapshot = state.controllerCheckpoint.snapshot;
    if (snapshot.status !== 'closed') return snapshot.leaseExpiresAt;
    return snapshot.closeReason === 'client-closed'
      ? Math.max(state.accessTokenExpiresAt, snapshot.leaseExpiresAt)
      : state.accessTokenExpiresAt;
  };

  const openRecord = async (
    record: RemoteExecutionTerminalStateRecord
  ): Promise<RemoteExecutionTerminalPortableState> => {
    if (
      !(record.sealedState instanceof Uint8Array) ||
      record.sealedState.byteLength === 0 ||
      record.sealedState.byteLength >
        REMOTE_EXECUTION_TERMINAL_STATE_LIMITS.maximumSealedBytes
    )
      throw new RemoteExecutionTerminalBrokerError(
        'identity-conflict',
        'Remote Terminal encrypted state is invalid.'
      );
    try {
      const plaintext = await options.stateCipher.open({
        executionId: record.executionId,
        terminalSessionId: record.terminalSessionId,
        revision: record.revision,
        expiresAt: record.expiresAt,
        sealedState: record.sealedState,
      });
      try {
        return decodeRemoteExecutionTerminalPortableState(plaintext, record);
      } finally {
        plaintext.fill(0);
      }
    } catch (error) {
      if (error instanceof RemoteExecutionTerminalStateCipherUnavailableError)
        throw new RemoteExecutionTerminalBrokerError(
          'unavailable',
          'Remote Terminal encrypted state is temporarily unavailable.'
        );
      throw new RemoteExecutionTerminalBrokerError(
        'identity-conflict',
        'Remote Terminal encrypted state failed authentication.'
      );
    }
  };

  const sealRecord = async (
    state: RemoteExecutionTerminalPortableState,
    revision: number
  ): Promise<RemoteExecutionTerminalStateRecord> => {
    const plaintext = encodeRemoteExecutionTerminalPortableState(state);
    const expiresAt = recordExpiry(state);
    let sealedState: Uint8Array;
    try {
      try {
        sealedState = await options.stateCipher.seal({
          executionId: state.executionId,
          terminalSessionId: state.terminalSessionId,
          revision,
          expiresAt,
          plaintext,
        });
      } catch (error) {
        if (error instanceof RemoteExecutionTerminalStateCipherUnavailableError)
          throw new RemoteExecutionTerminalBrokerError(
            'unavailable',
            'Remote Terminal encrypted state is temporarily unavailable.'
          );
        throw new RemoteExecutionTerminalBrokerError(
          'identity-conflict',
          'Remote Terminal encrypted state could not be sealed.'
        );
      }
    } finally {
      plaintext.fill(0);
    }
    if (
      !(sealedState instanceof Uint8Array) ||
      sealedState.byteLength === 0 ||
      sealedState.byteLength >
        REMOTE_EXECUTION_TERMINAL_STATE_LIMITS.maximumSealedBytes
    )
      throw new TypeError(
        'Remote Terminal encrypted state exceeds its budget.'
      );
    return Object.freeze({
      executionId: state.executionId,
      terminalSessionId: state.terminalSessionId,
      revision,
      expiresAt,
      sealedState: Uint8Array.from(sealedState),
    });
  };

  const exactRecord = async (
    executionId: string,
    terminalSessionId: string
  ): Promise<RemoteExecutionTerminalStateRecord> => {
    const record = await options.stateStore.get(
      identifier(executionId, 'Remote Terminal execution id'),
      identifier(terminalSessionId, 'Remote Terminal session id')
    );
    if (!record)
      throw new RemoteExecutionTerminalBrokerError(
        'not-found',
        'Remote Terminal session was not found.'
      );
    return record;
  };

  const transact = async <Result>(
    load: () => Promise<RemoteExecutionTerminalStateRecord | undefined>,
    mutate: (
      state: RemoteExecutionTerminalPortableState
    ) => Promise<ReplicatedRemoteExecutionTerminalMutation<Result>>
  ): Promise<Result> => {
    for (
      let attempt = 0;
      attempt < maximumCompareAndSwapAttempts;
      attempt += 1
    ) {
      const current = await load();
      if (!current)
        throw new RemoteExecutionTerminalBrokerError(
          'not-found',
          'Remote Terminal session was not found.'
        );
      const state = await openRecord(current);
      const changed = await mutate(state);
      if (!changed.dirty) {
        if (changed.error) throw changed.error;
        return changed.result;
      }
      const nextState = toPortableState(changed.state, changed.stored);
      const next = await sealRecord(nextState, current.revision + 1);
      if (await options.stateStore.compareAndSwap(current.revision, next)) {
        if (changed.error) throw changed.error;
        return changed.result;
      }
    }
    throw new RemoteExecutionTerminalBrokerError(
      'unavailable',
      'Remote Terminal state was concurrently modified; retry the operation.'
    );
  };

  const resolveHydrated = async (
    state: RemoteExecutionTerminalPortableState
  ): Promise<
    | Readonly<{
        hydrated: HydratedReplicatedRemoteExecutionTerminal;
        resolved: RemoteExecutionTerminalResolvedExecution;
      }>
    | Readonly<{
        hydrated: HydratedReplicatedRemoteExecutionTerminal;
        error: unknown;
      }>
  > => {
    let resolved: RemoteExecutionTerminalResolvedExecution;
    try {
      resolved = await resolveActiveExecution(state.executionId);
    } catch (error) {
      const hydrated = hydrate(
        state,
        Math.max(state.controllerCheckpoint.snapshot.leaseExpiresAt, now() + 1)
      );
      closeStored(hydrated.stored, 'execution-ended');
      return Object.freeze({ hydrated, error });
    }
    if (
      resolved.lease.workerId !== state.workerId ||
      resolved.lease.attempt !== state.workerAttempt ||
      !digestEqual(
        tokenDigest(resolved.lease.token),
        state.workerLeaseTokenDigest
      ) ||
      !sameProvider(resolved.execution.record.provider, state.provider)
    ) {
      const hydrated = hydrate(
        state,
        Math.max(state.controllerCheckpoint.snapshot.leaseExpiresAt, now() + 1)
      );
      closeStored(hydrated.stored, 'transport-lost');
      return Object.freeze({
        hydrated,
        error: new RemoteExecutionTerminalBrokerError(
          'identity-conflict',
          'Remote Terminal worker lease changed.'
        ),
      });
    }
    return Object.freeze({
      hydrated: hydrate(state, resolved.lease.expiresAt),
      resolved,
    });
  };

  const requireAccess = async <Result>(
    state: RemoteExecutionTerminalPortableState,
    accessToken: string,
    action: (
      hydrated: HydratedReplicatedRemoteExecutionTerminal
    ) => Promise<ReplicatedRemoteExecutionTerminalMutation<Result>>
  ): Promise<ReplicatedRemoteExecutionTerminalMutation<Result>> => {
    const normalizedToken = identifier(
      accessToken,
      'Remote Terminal access token'
    );
    if (
      state.accessTokenExpiresAt <= now() ||
      !state.accessTokenDigest ||
      !digestEqual(tokenDigest(normalizedToken), state.accessTokenDigest)
    )
      throw new RemoteExecutionTerminalBrokerError(
        'access-expired',
        'Remote Terminal access expired.'
      );
    const current = await resolveHydrated(state);
    if ('error' in current)
      return createReplicatedRemoteExecutionTerminalMutation({
        result: undefined as Result,
        state,
        stored: current.hydrated.stored,
        dirty: true,
        error: current.error,
      });
    return action(current.hydrated);
  };

  return Object.freeze({
    options,
    now,
    maximumSessions,
    maximumSweepRecords,
    secretValues,
    outputGuard,
    resolveActiveExecution,
    assertPrincipal,
    enqueueCommand,
    hydrate,
    toPortableState,
    flushOutput,
    closeStored,
    rotateAccess,
    openRecord,
    sealRecord,
    exactRecord,
    transact,
    resolveHydrated,
    requireAccess,
  });
};
