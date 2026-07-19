import { describe, expect, it } from 'vitest';
import type {
  DecryptCommandInput,
  DecryptCommandOutput,
  EncryptCommandInput,
  EncryptCommandOutput,
} from '@aws-sdk/client-kms';
import {
  createAwsKmsRemoteExecutionTerminalStateKeyManagementService,
  type AwsKmsRemoteExecutionTerminalStateOperations,
} from './terminalStateAwsKms';

const oldKeyArn =
  'arn:aws:kms:us-east-1:111122223333:key/11111111-1111-1111-1111-111111111111';
const activeKeyArn =
  'arn:aws:kms:us-east-1:111122223333:key/77777777-7777-7777-7777-777777777777';
const primaryMultiRegionKeyArn =
  'arn:aws:kms:us-east-1:111122223333:key/mrk-1234abcd1234abcd1234abcd1234abcd';
const replicaMultiRegionKeyArn =
  'arn:aws:kms:eu-west-1:111122223333:key/mrk-1234abcd1234abcd1234abcd1234abcd';

type MemoryRecord = Readonly<{
  keyArn: string;
  plaintext: Uint8Array;
  encryptionContext: Readonly<Record<string, string>>;
}>;

const sameContext = (
  left: Readonly<Record<string, string>> | undefined,
  right: Readonly<Record<string, string>>
): boolean => JSON.stringify(left) === JSON.stringify(right);

const createMemoryOperations = () => {
  const records = new Map<string, MemoryRecord>();
  const encryptInputs: EncryptCommandInput[] = [];
  let decryptCalls = 0;
  let next = 0;
  const operations: AwsKmsRemoteExecutionTerminalStateOperations =
    Object.freeze({
      async encrypt(input) {
        encryptInputs.push(input);
        next += 1;
        const ciphertext = new Uint8Array(96).fill(next);
        records.set(Buffer.from(ciphertext).toString('hex'), {
          keyArn: input.KeyId!,
          plaintext: Uint8Array.from(input.Plaintext!),
          encryptionContext: Object.freeze({ ...input.EncryptionContext }),
        });
        return {
          $metadata: {},
          KeyId: input.KeyId,
          EncryptionAlgorithm: 'SYMMETRIC_DEFAULT',
          CiphertextBlob: ciphertext,
        } satisfies EncryptCommandOutput;
      },
      async decrypt(input) {
        decryptCalls += 1;
        const record = records.get(
          Buffer.from(input.CiphertextBlob!).toString('hex')
        );
        if (
          !record ||
          record.keyArn !== input.KeyId ||
          !sameContext(input.EncryptionContext, record.encryptionContext)
        )
          throw new TypeError('fake AWS KMS rejected ciphertext');
        return {
          $metadata: {},
          KeyId: input.KeyId,
          EncryptionAlgorithm: 'SYMMETRIC_DEFAULT',
          Plaintext: Uint8Array.from(record.plaintext),
        } satisfies DecryptCommandOutput;
      },
    });
  return {
    operations,
    encryptInputs,
    decryptCalls: () => decryptCalls,
  } as const;
};

describe('Remote Terminal AWS managed KMS', () => {
  it('wraps only a data key with hashed CloudTrail-visible context', async () => {
    const memory = createMemoryOperations();
    const kms = createAwsKmsRemoteExecutionTerminalStateKeyManagementService({
      region: 'us-east-1',
      activeKeyId: 'key-active',
      keyArns: { 'key-active': activeKeyArn },
      operationTimeoutMs: 1_000,
      operations: memory.operations,
    });
    const dataKey = new Uint8Array(32).fill(0x42);
    const additionalData = Buffer.from(
      'execution-secret-identity\0terminal-secret-identity',
      'utf8'
    );
    const wrapped = await kms.wrapDataKey({ dataKey, additionalData });
    expect(wrapped.keyId).toBe('key-active');
    expect(wrapped.metadata).toHaveLength(32);
    expect(wrapped.wrappedKey).toHaveLength(96);
    const request = memory.encryptInputs[0]!;
    expect(request.KeyId).toBe(activeKeyArn);
    expect(request.EncryptionAlgorithm).toBe('SYMMETRIC_DEFAULT');
    expect(request.EncryptionContext).toEqual({
      'prodivix-aad-sha256': expect.stringMatching(/^[a-f0-9]{64}$/u),
      'prodivix-purpose': 'remote-terminal-state-data-key-v2',
    });
    expect(JSON.stringify(request.EncryptionContext)).not.toContain(
      'execution-secret-identity'
    );
    await expect(
      kms.unwrapDataKey({ ...wrapped, additionalData })
    ).resolves.toEqual(dataKey);

    const tamperedMetadata = Uint8Array.from(wrapped.metadata);
    tamperedMetadata[0]! ^= 1;
    await expect(
      kms.unwrapDataKey({
        ...wrapped,
        metadata: tamperedMetadata,
        additionalData,
      })
    ).rejects.toThrow(/wrapped data key/u);
    await expect(
      kms.unwrapDataKey({
        ...wrapped,
        additionalData: Buffer.from('wrong-aad'),
      })
    ).rejects.toThrow(/wrapped data key/u);
    expect(memory.decryptCalls()).toBe(1);
  });

  it('enforces exact immutable key ARNs, response identity, and bounded timeout', async () => {
    for (const input of [
      {
        region: 'eu-west-1',
        activeKeyId: 'key-old',
        keyArns: { 'key-old': oldKeyArn },
        operationTimeoutMs: 1_000,
      },
      {
        region: 'us-east-1',
        activeKeyId: 'key-old',
        keyArns: { 'key-old': 'alias/prodivix-terminal' },
        operationTimeoutMs: 1_000,
      },
      {
        region: 'us-east-1',
        activeKeyId: 'missing',
        keyArns: { 'key-old': oldKeyArn },
        operationTimeoutMs: 1_000,
      },
      {
        region: 'us-east-1',
        activeKeyId: 'key-old',
        keyArns: { 'key-old': oldKeyArn },
        operationTimeoutMs: 30_001,
      },
    ]) {
      expect(() =>
        createAwsKmsRemoteExecutionTerminalStateKeyManagementService({
          ...input,
          operations: createMemoryOperations().operations,
        })
      ).toThrow();
    }

    const driftedOperations: AwsKmsRemoteExecutionTerminalStateOperations = {
      async encrypt(
        _input: EncryptCommandInput
      ): Promise<EncryptCommandOutput> {
        return {
          $metadata: {},
          KeyId: oldKeyArn,
          EncryptionAlgorithm: 'SYMMETRIC_DEFAULT',
          CiphertextBlob: new Uint8Array(96),
        };
      },
      async decrypt(
        _input: DecryptCommandInput
      ): Promise<DecryptCommandOutput> {
        throw new TypeError('not used');
      },
    };
    const drifted =
      createAwsKmsRemoteExecutionTerminalStateKeyManagementService({
        region: 'us-east-1',
        activeKeyId: 'key-active',
        keyArns: { 'key-active': activeKeyArn },
        operationTimeoutMs: 1_000,
        operations: driftedOperations,
      });
    await expect(
      drifted.wrapDataKey({
        dataKey: new Uint8Array(32),
        additionalData: new Uint8Array([1]),
      })
    ).rejects.toThrow(/response is invalid/u);

    const timeoutOperations: AwsKmsRemoteExecutionTerminalStateOperations = {
      encrypt: (_input, signal) =>
        new Promise((_resolve, reject) => {
          signal.addEventListener('abort', () => reject(new Error('aborted')));
        }),
      async decrypt() {
        throw new TypeError('not used');
      },
    };
    const timeout =
      createAwsKmsRemoteExecutionTerminalStateKeyManagementService({
        region: 'us-east-1',
        activeKeyId: 'key-active',
        keyArns: { 'key-active': activeKeyArn },
        operationTimeoutMs: 1,
        operations: timeoutOperations,
      });
    await expect(
      timeout.wrapDataKey({
        dataKey: new Uint8Array(32),
        additionalData: new Uint8Array([1]),
      })
    ).rejects.toThrow(/temporarily unavailable/u);

    const networkFailure =
      createAwsKmsRemoteExecutionTerminalStateKeyManagementService({
        region: 'us-east-1',
        activeKeyId: 'key-active',
        keyArns: { 'key-active': activeKeyArn },
        operationTimeoutMs: 1_000,
        operations: {
          async encrypt() {
            throw Object.assign(new Error('socket failed'), {
              code: 'ECONNRESET',
            });
          },
          async decrypt() {
            throw new TypeError('not used');
          },
        },
      });
    await expect(
      networkFailure.wrapDataKey({
        dataKey: new Uint8Array(32),
        additionalData: new Uint8Array([1]),
      })
    ).rejects.toThrow(/temporarily unavailable/u);

    const permissionFailure =
      createAwsKmsRemoteExecutionTerminalStateKeyManagementService({
        region: 'us-east-1',
        activeKeyId: 'key-active',
        keyArns: { 'key-active': activeKeyArn },
        operationTimeoutMs: 1_000,
        operations: {
          async encrypt() {
            throw Object.assign(new Error('denied'), {
              name: 'AccessDeniedException',
            });
          },
          async decrypt() {
            throw new TypeError('not used');
          },
        },
      });
    await expect(
      permissionFailure.wrapDataKey({
        dataKey: new Uint8Array(32),
        additionalData: new Uint8Array([1]),
      })
    ).rejects.toThrow(/operation failed/u);
  });

  it('recovers a wrapped data key through an exact related multi-Region replica', async () => {
    const records = new Map<
      string,
      Readonly<{
        resourceId: string;
        plaintext: Uint8Array;
        encryptionContext: Readonly<Record<string, string>>;
      }>
    >();
    let next = 0;
    const operations: AwsKmsRemoteExecutionTerminalStateOperations = {
      async encrypt(input) {
        const ciphertext = new Uint8Array(96).fill((next += 1));
        records.set(Buffer.from(ciphertext).toString('hex'), {
          resourceId: input.KeyId!.split('/').at(-1)!,
          plaintext: Uint8Array.from(input.Plaintext!),
          encryptionContext: Object.freeze({ ...input.EncryptionContext }),
        });
        return {
          $metadata: {},
          KeyId: input.KeyId,
          EncryptionAlgorithm: 'SYMMETRIC_DEFAULT',
          CiphertextBlob: ciphertext,
        };
      },
      async decrypt(input) {
        const record = records.get(
          Buffer.from(input.CiphertextBlob!).toString('hex')
        );
        if (
          !record ||
          record.resourceId !== input.KeyId!.split('/').at(-1) ||
          !sameContext(input.EncryptionContext, record.encryptionContext)
        )
          throw new TypeError('fake multi-Region KMS rejected ciphertext');
        return {
          $metadata: {},
          KeyId: input.KeyId,
          EncryptionAlgorithm: 'SYMMETRIC_DEFAULT',
          Plaintext: Uint8Array.from(record.plaintext),
        };
      },
    };
    const primary =
      createAwsKmsRemoteExecutionTerminalStateKeyManagementService({
        region: 'us-east-1',
        activeKeyId: 'key-mrk',
        keyArns: { 'key-mrk': primaryMultiRegionKeyArn },
        operationTimeoutMs: 1_000,
        operations,
      });
    const replica =
      createAwsKmsRemoteExecutionTerminalStateKeyManagementService({
        region: 'eu-west-1',
        activeKeyId: 'key-mrk',
        keyArns: { 'key-mrk': replicaMultiRegionKeyArn },
        operationTimeoutMs: 1_000,
        operations,
      });
    const additionalData = Buffer.from('same-terminal-authority');
    const dataKey = new Uint8Array(32).fill(0x33);
    const wrapped = await primary.wrapDataKey({ dataKey, additionalData });
    await expect(
      replica.unwrapDataKey({ ...wrapped, additionalData })
    ).resolves.toEqual(dataKey);

    const unrelatedReplica =
      createAwsKmsRemoteExecutionTerminalStateKeyManagementService({
        region: 'eu-west-1',
        activeKeyId: 'key-mrk',
        keyArns: {
          'key-mrk':
            'arn:aws:kms:eu-west-1:111122223333:key/mrk-9999abcd1234abcd1234abcd1234abcd',
        },
        operationTimeoutMs: 1_000,
        operations,
      });
    await expect(
      unrelatedReplica.unwrapDataKey({ ...wrapped, additionalData })
    ).rejects.toThrow(/wrapped data key/u);
  });
});
