import { describe, expect, it } from 'vitest';
import {
  createAwsKmsRemoteExecutionTerminalStateKeyManagementService,
  createAwsSdkRemoteExecutionTerminalStateOperations,
} from './terminalStateAwsKms';
import { createManagedRemoteExecutionTerminalStateCipher } from './terminalStateManagedCipher';

const identity = Object.freeze({
  executionId: 'managed-kms-live-execution',
  terminalSessionId: 'managed-kms-live-terminal',
  revision: 1,
  expiresAt: 60_000,
});

describe('Remote Terminal live AWS KMS Gate', () => {
  it('seals, rotates, and retires exact managed key envelopes', async (context) => {
    const region = process.env.PRODIVIX_AWS_KMS_TEST_REGION?.trim() ?? '';
    const oldKeyArn =
      process.env.PRODIVIX_AWS_KMS_TEST_OLD_KEY_ARN?.trim() ?? '';
    const activeKeyArn =
      process.env.PRODIVIX_AWS_KMS_TEST_ACTIVE_KEY_ARN?.trim() ?? '';
    if (!region && !oldKeyArn && !activeKeyArn) {
      context.skip();
      return;
    }
    if (!region || !oldKeyArn || !activeKeyArn || oldKeyArn === activeKeyArn)
      throw new TypeError(
        'Remote Terminal live KMS Gate requires one region and two distinct exact key ARNs.'
      );
    const operations =
      createAwsSdkRemoteExecutionTerminalStateOperations(region);
    const plaintext = Buffer.from(
      'prodivix-remote-terminal-managed-kms-live-canary',
      'utf8'
    );
    const oldCipher = createManagedRemoteExecutionTerminalStateCipher({
      keyManagementService:
        createAwsKmsRemoteExecutionTerminalStateKeyManagementService({
          region,
          activeKeyId: 'key-old',
          keyArns: { 'key-old': oldKeyArn },
          operationTimeoutMs: 10_000,
          operations,
        }),
    });
    const original = await oldCipher.seal({ ...identity, plaintext });

    const rotatingCipher = createManagedRemoteExecutionTerminalStateCipher({
      keyManagementService:
        createAwsKmsRemoteExecutionTerminalStateKeyManagementService({
          region,
          activeKeyId: 'key-active',
          keyArns: {
            'key-old': oldKeyArn,
            'key-active': activeKeyArn,
          },
          operationTimeoutMs: 10_000,
          operations,
        }),
    });
    await expect(
      rotatingCipher.open({ ...identity, sealedState: original })
    ).resolves.toEqual(Uint8Array.from(plaintext));
    const rotated = await rotatingCipher.seal({ ...identity, plaintext });
    expect(rotated).not.toEqual(original);

    const retiredCipher = createManagedRemoteExecutionTerminalStateCipher({
      keyManagementService:
        createAwsKmsRemoteExecutionTerminalStateKeyManagementService({
          region,
          activeKeyId: 'key-active',
          keyArns: { 'key-active': activeKeyArn },
          operationTimeoutMs: 10_000,
          operations,
        }),
    });
    await expect(
      retiredCipher.open({ ...identity, sealedState: rotated })
    ).resolves.toEqual(Uint8Array.from(plaintext));
    await expect(
      retiredCipher.open({ ...identity, sealedState: original })
    ).rejects.toThrow(/wrapped data key/u);
    await expect(
      retiredCipher.open({ ...identity, revision: 2, sealedState: rotated })
    ).rejects.toThrow();
  }, 30_000);

  it('recovers through an exact multi-Region replica without a cross-Region KMS call', async (context) => {
    const primaryRegion =
      process.env.PRODIVIX_AWS_KMS_TEST_REGION?.trim() ?? '';
    const primaryKeyArn =
      process.env.PRODIVIX_AWS_KMS_TEST_ACTIVE_KEY_ARN?.trim() ?? '';
    const replicaRegion =
      process.env.PRODIVIX_AWS_KMS_TEST_REPLICA_REGION?.trim() ?? '';
    const replicaKeyArn =
      process.env.PRODIVIX_AWS_KMS_TEST_ACTIVE_REPLICA_KEY_ARN?.trim() ?? '';
    if (!replicaRegion && !replicaKeyArn) {
      context.skip();
      return;
    }
    if (!primaryRegion || !primaryKeyArn || !replicaRegion || !replicaKeyArn)
      throw new TypeError(
        'Remote Terminal multi-Region Gate requires exact primary and replica regions/key ARNs.'
      );
    const primary = createManagedRemoteExecutionTerminalStateCipher({
      keyManagementService:
        createAwsKmsRemoteExecutionTerminalStateKeyManagementService({
          region: primaryRegion,
          activeKeyId: 'key-mrk',
          keyArns: { 'key-mrk': primaryKeyArn },
          operationTimeoutMs: 10_000,
          operations:
            createAwsSdkRemoteExecutionTerminalStateOperations(primaryRegion),
        }),
    });
    const replica = createManagedRemoteExecutionTerminalStateCipher({
      keyManagementService:
        createAwsKmsRemoteExecutionTerminalStateKeyManagementService({
          region: replicaRegion,
          activeKeyId: 'key-mrk',
          keyArns: { 'key-mrk': replicaKeyArn },
          operationTimeoutMs: 10_000,
          operations:
            createAwsSdkRemoteExecutionTerminalStateOperations(replicaRegion),
        }),
    });
    const plaintext = Buffer.from(
      'prodivix-remote-terminal-multi-region-live-canary',
      'utf8'
    );
    const sealedState = await primary.seal({
      ...identity,
      revision: 2,
      plaintext,
    });
    await expect(
      replica.open({ ...identity, revision: 2, sealedState })
    ).resolves.toEqual(Uint8Array.from(plaintext));
  }, 30_000);
});
