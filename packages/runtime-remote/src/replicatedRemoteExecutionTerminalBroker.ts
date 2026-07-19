import { utf8ToBytes } from '@noble/hashes/utils.js';
import {
  createExecutionSecretTextStreamRedactor,
  createExecutionTerminalController,
  EXECUTION_TERMINAL_LIMITS,
} from '@prodivix/runtime-core';
import {
  createRemoteExecutionTerminalTokenDigest as tokenDigest,
  getRemoteExecutionTerminalCommandSize as commandSize,
  normalizeRemoteExecutionTerminalIdentifier as identifier,
  normalizeRemoteExecutionTerminalPositiveInteger as boundedPositiveInteger,
  remoteExecutionTerminalDigestEqual as digestEqual,
  RemoteExecutionTerminalBrokerError,
  type StoredRemoteExecutionTerminal as StoredTerminal,
} from './remoteExecutionTerminalBrokerSupport';
import {
  REMOTE_EXECUTION_TERMINAL_LIMITS,
  type RemoteExecutionTerminalBroker,
  type RemoteExecutionTerminalOpenResult,
} from './remoteExecutionTerminal.types';
import {
  createReplicatedRemoteExecutionTerminalBrokerContext,
  createReplicatedRemoteExecutionTerminalMutation as mutation,
  type CreateReplicatedRemoteExecutionTerminalBrokerOptions,
} from './replicatedRemoteExecutionTerminalBrokerSupport';

export type { CreateReplicatedRemoteExecutionTerminalBrokerOptions } from './replicatedRemoteExecutionTerminalBrokerSupport';

/**
 * Creates a replica-safe broker backed by an encrypted optimistic state row.
 * Every retry reconstructs the Core state machine, so no process-local object
 * is authoritative and concurrent client/worker operations keep idempotency.
 */
export const createReplicatedRemoteExecutionTerminalBroker = (
  options: CreateReplicatedRemoteExecutionTerminalBrokerOptions
): RemoteExecutionTerminalBroker => {
  const {
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
  } = createReplicatedRemoteExecutionTerminalBrokerContext(options);

  const broker: RemoteExecutionTerminalBroker = Object.freeze({
    async open(input) {
      const resolved = await resolveActiveExecution(input.executionId);
      assertPrincipal(input.principal, resolved.execution);
      if (await options.stateStore.getByExecution(input.executionId))
        throw new RemoteExecutionTerminalBrokerError(
          'identity-conflict',
          'Remote Terminal execution already has a session.'
        );
      const terminalSessionId = identifier(
        options.createTerminalSessionId(),
        'Remote Terminal session id'
      );
      let stored: StoredTerminal;
      const controller = createExecutionTerminalController({
        terminalSessionId,
        executionId: resolved.execution.record.executionId,
        jobId: resolved.execution.record.executionId,
        provider: resolved.execution.record.provider,
        capability: 'shell',
        grant: {
          grantId: `worker-lease:${resolved.lease.attempt}`,
          executionId: resolved.execution.record.executionId,
          jobId: resolved.execution.record.executionId,
          providerId: resolved.execution.record.provider.id,
          expiresAt: resolved.lease.expiresAt,
        },
        size: input.size,
        requestInput: ({ data, clientSequence }) =>
          enqueueCommand(stored, {
            kind: 'input',
            terminalSessionId,
            clientSequence,
            data,
          }),
        requestResize: (size) =>
          enqueueCommand(stored, {
            kind: 'resize',
            terminalSessionId,
            size,
          }),
        requestSignal: (signal) =>
          enqueueCommand(stored, {
            kind: 'signal',
            terminalSessionId,
            signal,
          }),
        requestClose: (reason) =>
          enqueueCommand(stored, {
            kind: 'close',
            terminalSessionId,
            reason,
          }),
        secretLeakGuard: outputGuard,
        now,
      });
      stored = {
        principalSubjectId: input.principal.subjectId,
        executionId: resolved.execution.record.executionId,
        terminalSessionId,
        workerId: resolved.lease.workerId,
        workerLeaseTokenDigest: tokenDigest(resolved.lease.token),
        workerAttempt: resolved.lease.attempt,
        controller,
        outputRedactors: Object.freeze({
          stdout: createExecutionSecretTextStreamRedactor({ secretValues }),
          stderr: createExecutionSecretTextStreamRedactor({ secretValues }),
        }),
        workerOutputFingerprints: new Map(),
        accessTokenDigest: '',
        accessTokenExpiresAt: 0,
        commandCursor: 0,
        acknowledgedCommandCursor: 0,
        commandBytes: 0,
        commands: [],
      };
      enqueueCommand(stored, {
        kind: 'open',
        terminalSessionId,
        size: controller.session.getSnapshot().size,
      });
      const result = rotateAccess(stored);
      const state = toPortableState(
        Object.freeze({
          format: 'prodivix.remote-terminal-state',
          version: 1,
          principalSubjectId: input.principal.subjectId,
          executionId: stored.executionId,
          terminalSessionId,
          workerId: stored.workerId,
          workerLeaseTokenDigest: stored.workerLeaseTokenDigest,
          workerAttempt: stored.workerAttempt,
          provider: resolved.execution.record.provider,
          controllerCheckpoint: controller.createCheckpoint(),
          outputRedactorCheckpoints: Object.freeze({
            stdout: stored.outputRedactors.stdout.createCheckpoint(),
            stderr: stored.outputRedactors.stderr.createCheckpoint(),
          }),
          workerOutputFingerprints: Object.freeze([]),
          accessTokenDigest: stored.accessTokenDigest,
          accessTokenExpiresAt: stored.accessTokenExpiresAt,
          commandCursor: stored.commandCursor,
          acknowledgedCommandCursor: 0,
          commandBytes: stored.commandBytes,
          commands: Object.freeze([...stored.commands]),
        }),
        stored
      );
      const created = await options.stateStore.create(
        await sealRecord(state, 1),
        maximumSessions
      );
      if (created === 'quota-exceeded')
        throw new RemoteExecutionTerminalBrokerError(
          'quota-exceeded',
          'Remote Terminal session budget was exceeded.'
        );
      if (created !== 'created')
        throw new RemoteExecutionTerminalBrokerError(
          'identity-conflict',
          'Remote Terminal session identity already exists.'
        );
      return result;
    },
    async resume(input) {
      return transact(
        () => exactRecord(input.executionId, input.terminalSessionId),
        async (state) => {
          const current = await resolveHydrated(state);
          if ('error' in current)
            return mutation({
              result: undefined as unknown as RemoteExecutionTerminalOpenResult,
              state,
              stored: current.hydrated.stored,
              dirty: true,
              error: current.error,
            });
          assertPrincipal(input.principal, current.resolved.execution);
          if (state.principalSubjectId !== input.principal.subjectId)
            throw new RemoteExecutionTerminalBrokerError(
              'forbidden',
              'Remote Terminal access is forbidden.'
            );
          return mutation({
            result: rotateAccess(current.hydrated.stored),
            state,
            stored: current.hydrated.stored,
            dirty: true,
          });
        }
      );
    },
    async read(input) {
      return transact(
        () => exactRecord(input.executionId, input.terminalSessionId),
        (state) =>
          requireAccess(state, input.accessToken, async (hydrated) =>
            mutation({
              result: hydrated.stored.controller.session.read({
                afterCursor: input.afterCursor,
                ...(input.maximumRecords === undefined
                  ? {}
                  : { maximumRecords: input.maximumRecords }),
              }),
              state,
              stored: hydrated.stored,
              dirty: hydrated.initiallyDirty,
            })
          )
      );
    },
    async write(input) {
      return transact(
        () => exactRecord(input.executionId, input.terminalSessionId),
        (state) =>
          requireAccess(state, input.accessToken, async (hydrated) => {
            const result = await hydrated.stored.controller.session.write({
              data: input.data,
              clientSequence: input.clientSequence,
            });
            return mutation({
              result,
              state,
              stored: hydrated.stored,
              dirty: hydrated.initiallyDirty || result.status === 'accepted',
            });
          })
      );
    },
    async resize(input) {
      return transact(
        () => exactRecord(input.executionId, input.terminalSessionId),
        (state) =>
          requireAccess(state, input.accessToken, async (hydrated) => {
            const result = await hydrated.stored.controller.session.resize(
              input.size
            );
            return mutation({
              result,
              state,
              stored: hydrated.stored,
              dirty: hydrated.initiallyDirty || result.status === 'accepted',
            });
          })
      );
    },
    async signal(input) {
      return transact(
        () => exactRecord(input.executionId, input.terminalSessionId),
        (state) =>
          requireAccess(state, input.accessToken, async (hydrated) => {
            const result = await hydrated.stored.controller.session.signal(
              input.signal
            );
            return mutation({
              result,
              state,
              stored: hydrated.stored,
              dirty: hydrated.initiallyDirty || result.status === 'accepted',
            });
          })
      );
    },
    async close(input) {
      return transact(
        () => exactRecord(input.executionId, input.terminalSessionId),
        (state) =>
          requireAccess(state, input.accessToken, async (hydrated) => {
            flushOutput(hydrated.stored);
            const result = await hydrated.stored.controller.session.close();
            hydrated.stored.accessTokenDigest = '';
            hydrated.stored.accessTokenExpiresAt = 0;
            return mutation({
              result,
              state,
              stored: hydrated.stored,
              dirty: true,
            });
          })
      );
    },
    async readWorkerCommands(input) {
      const existing = await options.stateStore.getByExecution(
        identifier(input.executionId, 'Remote Terminal execution id')
      );
      if (!existing) return undefined;
      return transact(
        () => options.stateStore.getByExecution(input.executionId),
        async (state) => {
          const current = await resolveHydrated(state);
          if ('error' in current)
            return mutation({
              result: undefined,
              state,
              stored: current.hydrated.stored,
              dirty: true,
              error: current.error,
            });
          if (
            current.resolved.lease.workerId !== input.workerId ||
            !digestEqual(
              tokenDigest(current.resolved.lease.token),
              tokenDigest(input.leaseToken)
            )
          )
            return mutation({
              result: undefined,
              state,
              stored: current.hydrated.stored,
              dirty: current.hydrated.initiallyDirty,
            });
          const stored = current.hydrated.stored;
          if (
            !Number.isSafeInteger(input.acknowledgedCommandCursor) ||
            input.acknowledgedCommandCursor <
              stored.acknowledgedCommandCursor ||
            input.acknowledgedCommandCursor > stored.commandCursor
          )
            throw new RemoteExecutionTerminalBrokerError(
              'identity-conflict',
              'Remote Terminal command acknowledgement is invalid.'
            );
          const acknowledgmentChanged =
            stored.acknowledgedCommandCursor !==
            input.acknowledgedCommandCursor;
          stored.acknowledgedCommandCursor = input.acknowledgedCommandCursor;
          const retained = stored.commands.filter(
            (command) => command.cursor > stored.acknowledgedCommandCursor
          );
          stored.commands = retained;
          stored.commandBytes = retained.reduce(
            (sum, command) => sum + commandSize(command),
            0
          );
          const maximum = boundedPositiveInteger(
            input.maximumCommands ??
              REMOTE_EXECUTION_TERMINAL_LIMITS.maximumWorkerReadCommands,
            'Remote Terminal worker command limit',
            REMOTE_EXECUTION_TERMINAL_LIMITS.maximumWorkerReadCommands
          );
          const commands = Object.freeze(retained.slice(0, maximum));
          return mutation({
            result: Object.freeze({
              terminalSessionId: stored.terminalSessionId,
              executionId: stored.executionId,
              acknowledgedCommandCursor: stored.acknowledgedCommandCursor,
              latestCommandCursor: stored.commandCursor,
              hasMore:
                (commands.at(-1)?.cursor ?? stored.acknowledgedCommandCursor) <
                stored.commandCursor,
              commands,
            }),
            state,
            stored,
            dirty: current.hydrated.initiallyDirty || acknowledgmentChanged,
          });
        }
      );
    },
    async publishWorkerOutput(input) {
      return transact(
        () => exactRecord(input.executionId, input.terminalSessionId),
        async (state) => {
          const current = await resolveHydrated(state);
          if ('error' in current)
            return mutation({
              result: 'lease-rejected' as const,
              state,
              stored: current.hydrated.stored,
              dirty: true,
            });
          const stored = current.hydrated.stored;
          if (
            current.resolved.lease.workerId !== input.workerId ||
            !digestEqual(
              tokenDigest(current.resolved.lease.token),
              tokenDigest(input.leaseToken)
            )
          )
            return mutation({
              result: 'lease-rejected' as const,
              state,
              stored,
              dirty: current.hydrated.initiallyDirty,
            });
          if (stored.controller.session.getSnapshot().status === 'closed')
            return mutation({
              result: 'session-closed' as const,
              state,
              stored,
              dirty: current.hydrated.initiallyDirty,
            });
          const workerOutputId = identifier(
            input.workerOutputId,
            'Remote Terminal worker output id'
          );
          if (
            workerOutputId.length >
            REMOTE_EXECUTION_TERMINAL_LIMITS.maximumWorkerOutputIdLength
          )
            throw new RemoteExecutionTerminalBrokerError(
              'invalid-request',
              'Remote Terminal worker output id exceeds its budget.'
            );
          const outputDigest = tokenDigest(
            `${input.stream}\0${input.redacted ? '1' : '0'}\0${input.data}`
          );
          const previous = stored.workerOutputFingerprints.get(workerOutputId);
          if (previous !== undefined) {
            if (previous === outputDigest)
              return mutation({
                result: 'existing' as const,
                state,
                stored,
                dirty: current.hydrated.initiallyDirty,
              });
            closeStored(stored, 'policy-revoked');
            return mutation({
              result: 'identity-conflict' as const,
              state,
              stored,
              dirty: true,
            });
          }
          if (
            utf8ToBytes(input.data).byteLength >
            EXECUTION_TERMINAL_LIMITS.maximumOutputChunkBytes
          )
            throw new RemoteExecutionTerminalBrokerError(
              'invalid-request',
              'Remote Terminal output exceeds its chunk budget.'
            );
          const redaction = stored.outputRedactors[input.stream].push(
            input.data
          );
          if (redaction.value)
            stored.controller.emitOutput({
              stream: input.stream,
              data: redaction.value,
              redacted: input.redacted || redaction.redacted,
            });
          stored.workerOutputFingerprints.set(workerOutputId, outputDigest);
          while (
            stored.workerOutputFingerprints.size >
            REMOTE_EXECUTION_TERMINAL_LIMITS.maximumOutputFingerprints
          ) {
            const oldest = stored.workerOutputFingerprints.keys().next().value;
            if (oldest === undefined) break;
            stored.workerOutputFingerprints.delete(oldest);
          }
          return mutation({
            result: 'stored' as const,
            state,
            stored,
            dirty: true,
          });
        }
      );
    },
    async closeFromWorker(input) {
      return transact(
        () => exactRecord(input.executionId, input.terminalSessionId),
        async (state) => {
          const current = await resolveHydrated(state);
          if ('error' in current)
            return mutation({
              result: false,
              state,
              stored: current.hydrated.stored,
              dirty: true,
            });
          const stored = current.hydrated.stored;
          if (
            current.resolved.lease.workerId !== input.workerId ||
            !digestEqual(
              tokenDigest(current.resolved.lease.token),
              tokenDigest(input.leaseToken)
            )
          )
            return mutation({
              result: false,
              state,
              stored,
              dirty: current.hydrated.initiallyDirty,
            });
          closeStored(stored, input.reason, input.exitCode);
          return mutation({ result: true, state, stored, dirty: true });
        }
      );
    },
    async closeExecution(executionId, reason = 'execution-ended') {
      const normalized = identifier(
        executionId,
        'Remote Terminal execution id'
      );
      if (!(await options.stateStore.getByExecution(normalized))) return 0;
      return transact(
        () => options.stateStore.getByExecution(normalized),
        async (state) => {
          const hydrated = hydrate(
            state,
            Math.max(
              state.controllerCheckpoint.snapshot.leaseExpiresAt,
              now() + 1
            )
          );
          closeStored(hydrated.stored, reason);
          return mutation({
            result: 1,
            state,
            stored: hydrated.stored,
            dirty: true,
          });
        }
      );
    },
    async sweepExpired() {
      const records = await options.stateStore.listExpired(
        now(),
        maximumSweepRecords
      );
      let swept = 0;
      for (const candidate of records) {
        try {
          const initial = await openRecord(candidate);
          if (initial.controllerCheckpoint.snapshot.status !== 'closed')
            await transact(
              () =>
                options.stateStore.get(
                  candidate.executionId,
                  candidate.terminalSessionId
                ),
              async (state) => {
                const current = await resolveHydrated(state);
                return mutation({
                  result: undefined,
                  state,
                  stored: current.hydrated.stored,
                  dirty: 'error' in current || current.hydrated.initiallyDirty,
                });
              }
            );
          const current = await options.stateStore.get(
            candidate.executionId,
            candidate.terminalSessionId
          );
          if (!current || current.expiresAt > now()) continue;
          const state = await openRecord(current);
          if (
            state.controllerCheckpoint.snapshot.status === 'closed' &&
            (await options.stateStore.delete(
              current.executionId,
              current.terminalSessionId,
              current.revision
            ))
          )
            swept += 1;
        } catch {
          // Authenticated state failures require operator review, not deletion.
        }
      }
      return swept;
    },
  });
  return broker;
};
