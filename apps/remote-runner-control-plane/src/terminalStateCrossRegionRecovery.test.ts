import { describe, expect, it } from 'vitest';
import type {
  DecryptCommandOutput,
  EncryptCommandOutput,
} from '@aws-sdk/client-kms';
import {
  createExecutionProviderDescriptor,
  createExecutionRequest,
} from '@prodivix/runtime-core';
import {
  createMemoryRemoteExecutionTerminalStateStore,
  createReplicatedRemoteExecutionTerminalBroker,
  type RemoteExecutionStoredRecord,
} from '@prodivix/runtime-remote';
import {
  createAwsKmsRemoteExecutionTerminalStateKeyManagementService,
  type AwsKmsRemoteExecutionTerminalStateOperations,
} from './terminalStateAwsKms';
import { createAesGcmRemoteExecutionTerminalStateCipher } from './terminalStateCipher';
import { createManagedRemoteExecutionTerminalStateCipher } from './terminalStateManagedCipher';

const primaryKeyArn =
  'arn:aws:kms:us-east-1:111122223333:key/mrk-1234abcd1234abcd1234abcd1234abcd';
const replicaKeyArn =
  'arn:aws:kms:eu-west-1:111122223333:key/mrk-1234abcd1234abcd1234abcd1234abcd';

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
  requestId: 'request-multi-region',
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

type KmsRecord = Readonly<{
  keyResourceId: string;
  plaintext: Uint8Array;
  context: Readonly<Record<string, string>>;
}>;

const createOperations = (
  records: Map<string, KmsRecord>,
  sequence: { value: number }
): AwsKmsRemoteExecutionTerminalStateOperations =>
  Object.freeze({
    async encrypt(input) {
      const ciphertext = new Uint8Array(96).fill((sequence.value += 1));
      records.set(Buffer.from(ciphertext).toString('hex'), {
        keyResourceId: input.KeyId!.split('/').at(-1)!,
        plaintext: Uint8Array.from(input.Plaintext!),
        context: Object.freeze({ ...input.EncryptionContext }),
      });
      return {
        $metadata: {},
        KeyId: input.KeyId,
        EncryptionAlgorithm: 'SYMMETRIC_DEFAULT',
        CiphertextBlob: ciphertext,
      } satisfies EncryptCommandOutput;
    },
    async decrypt(input) {
      const record = records.get(
        Buffer.from(input.CiphertextBlob!).toString('hex')
      );
      if (
        !record ||
        record.keyResourceId !== input.KeyId!.split('/').at(-1) ||
        JSON.stringify(record.context) !==
          JSON.stringify(input.EncryptionContext)
      )
        throw new TypeError('multi-Region KMS rejected ciphertext');
      return {
        $metadata: {},
        KeyId: input.KeyId,
        EncryptionAlgorithm: 'SYMMETRIC_DEFAULT',
        Plaintext: Uint8Array.from(record.plaintext),
      } satisfies DecryptCommandOutput;
    },
  });

describe('Remote Terminal cross-Region recovery', () => {
  it('continues one authority row through related MRK replicas and independent brokers', async () => {
    const stateStore = createMemoryRemoteExecutionTerminalStateStore();
    const records = new Map<string, KmsRecord>();
    const sequence = { value: 0 };
    let tokenSequence = 0;
    const createBroker = (region: string, keyArn: string) =>
      createReplicatedRemoteExecutionTerminalBroker({
        stateStore,
        stateCipher: createManagedRemoteExecutionTerminalStateCipher({
          keyManagementService:
            createAwsKmsRemoteExecutionTerminalStateKeyManagementService({
              region,
              activeKeyId: 'key-mrk',
              keyArns: { 'key-mrk': keyArn },
              operationTimeoutMs: 1_000,
              operations: createOperations(records, sequence),
            }),
        }),
        resolveExecution: async () => execution,
        createTerminalSessionId: () => 'terminal-1',
        createAccessToken: () => `terminal-token-${++tokenSequence}`,
        now: () => 100,
      });
    const primary = createBroker('us-east-1', primaryKeyArn);
    const replica = createBroker('eu-west-1', replicaKeyArn);
    const principal = Object.freeze({
      subjectId: 'principal-1',
      scopes: Object.freeze(['remote-execution:terminal']),
    });

    const opened = await primary.open({
      principal,
      executionId: 'execution-1',
      size: { columns: 100, rows: 30 },
    });
    await expect(
      replica.write({
        accessToken: opened.access.token,
        executionId: 'execution-1',
        terminalSessionId: 'terminal-1',
        data: 'cross-region-input\n',
        clientSequence: 1,
      })
    ).resolves.toEqual({ status: 'accepted', clientSequence: 1 });
    const commands = await primary.readWorkerCommands({
      executionId: 'execution-1',
      workerId: 'worker-1',
      leaseToken: 'worker-lease-secret',
      acknowledgedCommandCursor: 0,
    });
    expect(commands?.commands.map(({ kind }) => kind)).toEqual([
      'open',
      'input',
    ]);
    await expect(
      primary.publishWorkerOutput({
        executionId: 'execution-1',
        workerId: 'worker-1',
        leaseToken: 'worker-lease-secret',
        terminalSessionId: 'terminal-1',
        workerOutputId: 'output-1',
        stream: 'stdout',
        data: 'cross-region-output',
        redacted: false,
      })
    ).resolves.toBe('stored');
    const output = await replica.read({
      accessToken: opened.access.token,
      executionId: 'execution-1',
      terminalSessionId: 'terminal-1',
      afterCursor: 0,
    });
    expect(output.records.map(({ data }) => data).join('')).toBe(
      'cross-region-output'
    );
    await expect(
      replica.resume({
        principal,
        executionId: 'execution-1',
        terminalSessionId: 'terminal-1',
      })
    ).resolves.toMatchObject({ access: { token: 'terminal-token-2' } });

    const record = await stateStore.getByExecution('execution-1');
    expect(record?.revision).toBeGreaterThan(1);
    expect(
      Buffer.from(record!.sealedState).subarray(0, 4).toString('ascii')
    ).toBe('PRT2');
    expect(Buffer.from(record!.sealedState).toString('utf8')).not.toContain(
      'cross-region-input'
    );
  });

  it('migrates a live PRT1 broker row to PRT2 behind the same revision CAS', async () => {
    const stateStore = createMemoryRemoteExecutionTerminalStateStore();
    const staticKey = new Uint8Array(32).fill(0x44);
    const legacyCipher = createAesGcmRemoteExecutionTerminalStateCipher({
      activeKeyId: 'key-static',
      keys: [{ keyId: 'key-static', key: staticKey }],
    });
    const common = {
      stateStore,
      resolveExecution: async () => execution,
      createTerminalSessionId: () => 'terminal-migration',
      createAccessToken: () => 'migration-access-token',
      now: () => 100,
    } as const;
    const legacyBroker = createReplicatedRemoteExecutionTerminalBroker({
      ...common,
      stateCipher: legacyCipher,
    });
    const principal = Object.freeze({
      subjectId: 'principal-1',
      scopes: Object.freeze(['remote-execution:terminal']),
    });
    const opened = await legacyBroker.open({
      principal,
      executionId: 'execution-1',
      size: { columns: 80, rows: 24 },
    });
    const legacyRecord = await stateStore.getByExecution('execution-1');
    expect(
      Buffer.from(legacyRecord!.sealedState).subarray(0, 4).toString('ascii')
    ).toBe('PRT1');

    const records = new Map<string, KmsRecord>();
    const managedBroker = createReplicatedRemoteExecutionTerminalBroker({
      ...common,
      stateCipher: createManagedRemoteExecutionTerminalStateCipher({
        keyManagementService:
          createAwsKmsRemoteExecutionTerminalStateKeyManagementService({
            region: 'us-east-1',
            activeKeyId: 'key-mrk',
            keyArns: { 'key-mrk': primaryKeyArn },
            operationTimeoutMs: 1_000,
            operations: createOperations(records, { value: 0 }),
          }),
        legacyStaticCipher: legacyCipher,
      }),
    });
    await expect(
      managedBroker.write({
        accessToken: opened.access.token,
        executionId: 'execution-1',
        terminalSessionId: 'terminal-migration',
        data: 'migrate-once\n',
        clientSequence: 1,
      })
    ).resolves.toEqual({ status: 'accepted', clientSequence: 1 });
    const managedRecord = await stateStore.getByExecution('execution-1');
    expect(managedRecord?.revision).toBe(2);
    expect(
      Buffer.from(managedRecord!.sealedState).subarray(0, 4).toString('ascii')
    ).toBe('PRT2');
  });
});
