import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from 'node:crypto';
import { describe, expect, it } from 'vitest';
import {
  createExecutionProviderDescriptor,
  createExecutionRequest,
  EXECUTION_SECRET_REDACTION_MARKER,
} from '@prodivix/runtime-core';
import type { RemoteExecutionStoredRecord } from './remoteExecutionControlPlane.types';
import { createReplicatedRemoteExecutionTerminalBroker } from './replicatedRemoteExecutionTerminalBroker';
import {
  createMemoryRemoteExecutionTerminalStateStore,
  RemoteExecutionTerminalStateCipherUnavailableError,
  type RemoteExecutionTerminalStateCipher,
} from './remoteExecutionTerminalState';

const provider = createExecutionProviderDescriptor({
  id: 'prodivix.remote.preview',
  version: '1',
  isolation: 'remote-isolated',
  profiles: ['preview'],
  runtimeZones: ['client'],
  invocationKinds: ['workspace'],
  capabilities: ['terminal'],
});

const request = createExecutionRequest({
  requestId: 'request-1',
  profile: 'preview',
  runtimeZone: 'client',
  workspace: { workspaceId: 'workspace-1', snapshotId: 'snapshot-1' },
  invocation: {
    kind: 'workspace',
    targetRef: { kind: 'workspace', workspaceId: 'workspace-1' },
  },
});

const execution: RemoteExecutionStoredRecord = Object.freeze({
  ownerId: 'principal-1',
  identityKey: 'identity-1',
  request,
  snapshotId: 'snapshot-1',
  record: Object.freeze({
    executionId: 'execution-1',
    requestId: request.requestId,
    snapshotDigest:
      'sha256-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    provider,
    status: 'running',
    latestCursor: 1,
    createdAt: 10,
    startedAt: 20,
  }),
  events: Object.freeze([]),
  artifacts: Object.freeze([]),
  cancellationIds: Object.freeze([]),
  lease: Object.freeze({
    workerId: 'worker-1',
    token: 'worker-lease-secret',
    attempt: 1,
    acquiredAt: 20,
    expiresAt: 10_000,
  }),
});

const aad = (input: {
  executionId: string;
  terminalSessionId: string;
  revision: number;
  expiresAt: number;
}): Buffer =>
  Buffer.from(
    `prodivix.remote-terminal.state.v1\0${input.executionId}\0${input.terminalSessionId}\0${input.revision}\0${input.expiresAt}`,
    'utf8'
  );

const createTestStateCipher = (): Readonly<{
  cipher: RemoteExecutionTerminalStateCipher;
  sealedStates: Uint8Array[];
}> => {
  const key = createHash('sha256').update('replicated-terminal-test').digest();
  const sealedStates: Uint8Array[] = [];
  return Object.freeze({
    sealedStates,
    cipher: Object.freeze({
      async seal(
        input: Parameters<RemoteExecutionTerminalStateCipher['seal']>[0]
      ) {
        const nonce = randomBytes(12);
        const cipher = createCipheriv('aes-256-gcm', key, nonce);
        cipher.setAAD(aad(input));
        const ciphertext = Buffer.concat([
          cipher.update(input.plaintext),
          cipher.final(),
        ]);
        const sealed = Buffer.concat([nonce, cipher.getAuthTag(), ciphertext]);
        sealedStates.push(Uint8Array.from(sealed));
        return Uint8Array.from(sealed);
      },
      async open(
        input: Parameters<RemoteExecutionTerminalStateCipher['open']>[0]
      ) {
        const sealed = Buffer.from(input.sealedState);
        const decipher = createDecipheriv(
          'aes-256-gcm',
          key,
          sealed.subarray(0, 12)
        );
        decipher.setAAD(aad(input));
        decipher.setAuthTag(sealed.subarray(12, 28));
        return Uint8Array.from(
          Buffer.concat([
            decipher.update(sealed.subarray(28)),
            decipher.final(),
          ])
        );
      },
    }),
  });
};

describe('replicated Remote execution Terminal broker', () => {
  it('preserves the exact authority revision across retryable cipher outages', async () => {
    const stateStore = createMemoryRemoteExecutionTerminalStateStore();
    const base = createTestStateCipher().cipher;
    let failOpen = false;
    let failSeal = false;
    const broker = createReplicatedRemoteExecutionTerminalBroker({
      stateStore,
      stateCipher: Object.freeze({
        async seal(input) {
          if (failSeal)
            throw new RemoteExecutionTerminalStateCipherUnavailableError();
          return base.seal(input);
        },
        async open(input) {
          if (failOpen)
            throw new RemoteExecutionTerminalStateCipherUnavailableError();
          return base.open(input);
        },
      }),
      resolveExecution: async () => execution,
      createTerminalSessionId: () => 'terminal-outage',
      createAccessToken: () => 'outage-access-token',
      now: () => 100,
    });
    const principal = Object.freeze({
      subjectId: 'principal-1',
      scopes: Object.freeze(['remote-execution:terminal']),
    });
    const opened = await broker.open({
      principal,
      executionId: 'execution-1',
      size: { columns: 80, rows: 24 },
    });
    await expect(
      stateStore.getByExecution('execution-1')
    ).resolves.toMatchObject({ revision: 1 });

    failOpen = true;
    await expect(
      broker.resume({
        principal,
        executionId: 'execution-1',
        terminalSessionId: 'terminal-outage',
      })
    ).rejects.toMatchObject({ code: 'unavailable' });
    await expect(
      stateStore.getByExecution('execution-1')
    ).resolves.toMatchObject({ revision: 1 });

    failOpen = false;
    failSeal = true;
    await expect(
      broker.write({
        accessToken: opened.access.token,
        executionId: 'execution-1',
        terminalSessionId: 'terminal-outage',
        data: 'retry-after-kms-recovery\n',
        clientSequence: 1,
      })
    ).rejects.toMatchObject({ code: 'unavailable' });
    await expect(
      stateStore.getByExecution('execution-1')
    ).resolves.toMatchObject({ revision: 1 });

    failSeal = false;
    await expect(
      broker.write({
        accessToken: opened.access.token,
        executionId: 'execution-1',
        terminalSessionId: 'terminal-outage',
        data: 'retry-after-kms-recovery\n',
        clientSequence: 1,
      })
    ).resolves.toEqual({ status: 'accepted', clientSequence: 1 });
    const commands = await broker.readWorkerCommands({
      executionId: 'execution-1',
      workerId: 'worker-1',
      leaseToken: 'worker-lease-secret',
      acknowledgedCommandCursor: 0,
    });
    expect(commands?.commands.map(({ kind }) => kind)).toEqual([
      'open',
      'input',
    ]);
  });

  it('continues tokens, mailboxes, cursors, and cross-chunk redaction on another replica', async () => {
    const stateStore = createMemoryRemoteExecutionTerminalStateStore();
    const replicaACipher = createTestStateCipher();
    const replicaBCipher = createTestStateCipher();
    let tokenSequence = 0;
    const createBroker = (cipher: RemoteExecutionTerminalStateCipher) =>
      createReplicatedRemoteExecutionTerminalBroker({
        stateStore,
        stateCipher: cipher,
        resolveExecution: async () => execution,
        createTerminalSessionId: () => 'terminal-1',
        createAccessToken: () => `terminal-token-${++tokenSequence}`,
        secretValues: ['terminal-secret-canary'],
        now: () => 100,
      });
    const replicaA = createBroker(replicaACipher.cipher);
    const replicaB = createBroker(replicaBCipher.cipher);
    const principal = Object.freeze({
      subjectId: 'principal-1',
      scopes: Object.freeze(['remote-execution:terminal']),
    });

    const opened = await replicaA.open({
      principal,
      executionId: 'execution-1',
      size: { columns: 100, rows: 30 },
    });
    expect(
      await replicaB.write({
        accessToken: opened.access.token,
        executionId: 'execution-1',
        terminalSessionId: 'terminal-1',
        data: 'first-input\n',
        clientSequence: 1,
      })
    ).toEqual({ status: 'accepted', clientSequence: 1 });

    const sameInput = await Promise.all([
      replicaA.write({
        accessToken: opened.access.token,
        executionId: 'execution-1',
        terminalSessionId: 'terminal-1',
        data: 'second-input\n',
        clientSequence: 2,
      }),
      replicaB.write({
        accessToken: opened.access.token,
        executionId: 'execution-1',
        terminalSessionId: 'terminal-1',
        data: 'second-input\n',
        clientSequence: 2,
      }),
    ]);
    expect(sameInput.map(({ status }) => status).sort()).toEqual([
      'accepted',
      'duplicate',
    ]);
    const driftedInput = await Promise.all([
      replicaA.write({
        accessToken: opened.access.token,
        executionId: 'execution-1',
        terminalSessionId: 'terminal-1',
        data: 'third-left\n',
        clientSequence: 3,
      }),
      replicaB.write({
        accessToken: opened.access.token,
        executionId: 'execution-1',
        terminalSessionId: 'terminal-1',
        data: 'third-right\n',
        clientSequence: 3,
      }),
    ]);
    expect(driftedInput.map(({ status }) => status).sort()).toEqual([
      'accepted',
      'conflict',
    ]);

    const commands = await replicaA.readWorkerCommands({
      executionId: 'execution-1',
      workerId: 'worker-1',
      leaseToken: 'worker-lease-secret',
      acknowledgedCommandCursor: 0,
    });
    expect(commands?.commands.map(({ kind }) => kind)).toEqual([
      'open',
      'input',
      'input',
      'input',
    ]);
    expect(
      await replicaA.publishWorkerOutput({
        executionId: 'execution-1',
        workerId: 'worker-1',
        leaseToken: 'worker-lease-secret',
        terminalSessionId: 'terminal-1',
        workerOutputId: 'output-prefix',
        stream: 'stdout',
        data: 'visible:terminal-',
        redacted: false,
      })
    ).toBe('stored');
    await expect(
      replicaA.publishWorkerOutput({
        executionId: 'execution-1',
        workerId: 'worker-1',
        leaseToken: 'worker-lease-secret',
        terminalSessionId: 'terminal-1',
        workerOutputId: 'x'.repeat(257),
        stream: 'stdout',
        data: 'rejected-before-state-growth',
        redacted: false,
      })
    ).rejects.toMatchObject({ code: 'invalid-request' });
    expect(
      await replicaB.publishWorkerOutput({
        executionId: 'execution-1',
        workerId: 'worker-1',
        leaseToken: 'worker-lease-secret',
        terminalSessionId: 'terminal-1',
        workerOutputId: 'output-suffix',
        stream: 'stdout',
        data: 'secret-canary:tail',
        redacted: false,
      })
    ).toBe('stored');
    await expect(
      replicaA.publishWorkerOutput({
        executionId: 'execution-1',
        workerId: 'worker-1',
        leaseToken: 'worker-lease-secret',
        terminalSessionId: 'terminal-1',
        workerOutputId: 'output-suffix',
        stream: 'stdout',
        data: 'secret-canary:tail',
        redacted: false,
      })
    ).resolves.toBe('existing');

    const output = await replicaB.read({
      accessToken: opened.access.token,
      executionId: 'execution-1',
      terminalSessionId: 'terminal-1',
      afterCursor: 0,
    });
    const text = output.records.map(({ data }) => data).join('');
    expect(text).toBe(`visible:${EXECUTION_SECRET_REDACTION_MARKER}:tail`);
    expect(text).not.toContain('terminal-secret-canary');

    const resumed = await replicaB.resume({
      principal,
      executionId: 'execution-1',
      terminalSessionId: 'terminal-1',
    });
    expect(resumed.access.token).toBe('terminal-token-2');
    await expect(
      replicaA.read({
        accessToken: opened.access.token,
        executionId: 'execution-1',
        terminalSessionId: 'terminal-1',
        afterCursor: output.nextCursor,
      })
    ).rejects.toMatchObject({ code: 'access-expired' });
    await expect(
      replicaA.read({
        accessToken: resumed.access.token,
        executionId: 'execution-1',
        terminalSessionId: 'terminal-1',
        afterCursor: output.nextCursor,
      })
    ).resolves.toMatchObject({ latestCursor: output.latestCursor });
    await expect(
      replicaB.close({
        accessToken: resumed.access.token,
        executionId: 'execution-1',
        terminalSessionId: 'terminal-1',
      })
    ).resolves.toEqual({ status: 'closed' });
    await expect(
      replicaA.readWorkerCommands({
        executionId: 'execution-1',
        workerId: 'worker-1',
        leaseToken: 'worker-lease-secret',
        acknowledgedCommandCursor: 0,
      })
    ).resolves.toMatchObject({
      commands: expect.arrayContaining([
        expect.objectContaining({ kind: 'close' }),
      ]),
    });
    await expect(
      stateStore.getByExecution('execution-1')
    ).resolves.toMatchObject({ expiresAt: 10_000 });

    const sealedText = [
      ...replicaACipher.sealedStates,
      ...replicaBCipher.sealedStates,
    ]
      .map((state) => Buffer.from(state).toString('utf8'))
      .join('');
    expect(sealedText).not.toContain('first-input');
    expect(sealedText).not.toContain('terminal-secret-canary');
    expect(sealedText).not.toContain('terminal-token-1');
  });

  it('renews an active lease during sweep and purges a worker-loss generation', async () => {
    const stateStore = createMemoryRemoteExecutionTerminalStateStore();
    const { cipher } = createTestStateCipher();
    let clock = 100;
    let currentExecution = execution;
    let tokenSequence = 0;
    const broker = createReplicatedRemoteExecutionTerminalBroker({
      stateStore,
      stateCipher: cipher,
      resolveExecution: async () => currentExecution,
      createTerminalSessionId: () => 'terminal-recovery',
      createAccessToken: () => `recovery-token-${++tokenSequence}`,
      now: () => clock,
    });
    const principal = {
      subjectId: 'principal-1',
      scopes: ['remote-execution:terminal'],
    } as const;
    const opened = await broker.open({
      principal,
      executionId: 'execution-1',
      size: { columns: 80, rows: 24 },
    });
    currentExecution = Object.freeze({
      ...execution,
      lease: Object.freeze({ ...execution.lease!, expiresAt: 20_000 }),
    });
    clock = 10_000;
    await expect(broker.sweepExpired()).resolves.toBe(0);
    await expect(
      broker.resume({
        principal,
        executionId: 'execution-1',
        terminalSessionId: opened.snapshot.terminalSessionId,
      })
    ).resolves.toMatchObject({ snapshot: { leaseExpiresAt: 20_000 } });

    currentExecution = Object.freeze({
      ...currentExecution,
      lease: Object.freeze({
        workerId: 'worker-2',
        token: 'replacement-worker-lease',
        attempt: 2,
        acquiredAt: 10_000,
        expiresAt: 30_000,
      }),
    });
    await expect(
      broker.publishWorkerOutput({
        executionId: 'execution-1',
        workerId: 'worker-1',
        leaseToken: 'worker-lease-secret',
        terminalSessionId: opened.snapshot.terminalSessionId,
        workerOutputId: 'late-output',
        stream: 'stdout',
        data: 'late',
        redacted: false,
      })
    ).resolves.toBe('lease-rejected');
    await expect(broker.sweepExpired()).resolves.toBe(1);
    await expect(
      broker.resume({
        principal,
        executionId: 'execution-1',
        terminalSessionId: opened.snapshot.terminalSessionId,
      })
    ).rejects.toMatchObject({ code: 'not-found' });
  });
});
