import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { createAesGcmRemoteExecutionTerminalStateCipher } from './terminalStateCipher';
import {
  createManagedRemoteExecutionTerminalStateCipher,
  type RemoteExecutionTerminalStateKeyManagementService,
} from './terminalStateManagedCipher';

const identity = Object.freeze({
  executionId: 'execution-1',
  terminalSessionId: 'terminal-1',
  revision: 7,
  expiresAt: 10_000,
});

type MemoryRecord = Readonly<{
  keyId: string;
  dataKey: Uint8Array;
  additionalData: Uint8Array;
  metadata: Uint8Array;
}>;

const metadata = (
  keyId: string,
  wrappedKey: Uint8Array,
  additionalData: Uint8Array
): Uint8Array =>
  Uint8Array.from(
    createHash('sha256')
      .update(keyId)
      .update(wrappedKey)
      .update(additionalData)
      .digest()
  );

const createMemoryKms = (
  activeKeyId: string,
  readableKeyIds: readonly string[],
  records: Map<string, MemoryRecord>,
  next: { value: number }
): RemoteExecutionTerminalStateKeyManagementService =>
  Object.freeze({
    providerId: 'test.kms/v1',
    activeKeyId,
    async wrapDataKey(input) {
      next.value += 1;
      const wrappedKey = Uint8Array.from(
        createHash('sha256').update(`wrapped-${next.value}`).digest()
      );
      const record = Object.freeze({
        keyId: activeKeyId,
        dataKey: Uint8Array.from(input.dataKey),
        additionalData: Uint8Array.from(input.additionalData),
        metadata: metadata(activeKeyId, wrappedKey, input.additionalData),
      });
      records.set(Buffer.from(wrappedKey).toString('hex'), record);
      return Object.freeze({
        keyId: activeKeyId,
        metadata: record.metadata,
        wrappedKey,
      });
    },
    async unwrapDataKey(input) {
      const record = records.get(Buffer.from(input.wrappedKey).toString('hex'));
      if (
        !record ||
        record.keyId !== input.keyId ||
        !readableKeyIds.includes(input.keyId) ||
        !Buffer.from(record.additionalData).equals(input.additionalData) ||
        !Buffer.from(record.metadata).equals(input.metadata) ||
        !Buffer.from(
          metadata(input.keyId, input.wrappedKey, input.additionalData)
        ).equals(input.metadata)
      )
        throw new TypeError('memory KMS rejected the envelope');
      return Uint8Array.from(record.dataKey);
    },
  });

const deterministicRandom = () => {
  let value = 0;
  return (size: number): Uint8Array => new Uint8Array(size).fill((value += 1));
};

describe('Remote Terminal managed state cipher', () => {
  it('continues across independent replicas and binds every envelope surface', async () => {
    const records = new Map<string, MemoryRecord>();
    const next = { value: 0 };
    const replicaA = createManagedRemoteExecutionTerminalStateCipher({
      keyManagementService: createMemoryKms(
        'key-active',
        ['key-active'],
        records,
        next
      ),
      randomBytes: deterministicRandom(),
    });
    const replicaB = createManagedRemoteExecutionTerminalStateCipher({
      keyManagementService: createMemoryKms(
        'key-active',
        ['key-active'],
        records,
        next
      ),
      randomBytes: deterministicRandom(),
    });
    const plaintext = Buffer.from('stdin=managed-kms-secret-canary', 'utf8');
    const sealedState = await replicaA.seal({ ...identity, plaintext });
    expect(Buffer.from(sealedState).subarray(0, 4).toString('ascii')).toBe(
      'PRT2'
    );
    expect(Buffer.from(sealedState).includes(plaintext)).toBe(false);
    await expect(replicaB.open({ ...identity, sealedState })).resolves.toEqual(
      Uint8Array.from(plaintext)
    );
    await expect(
      replicaB.open({ ...identity, revision: 8, sealedState })
    ).rejects.toThrow();
    await expect(
      replicaB.open({ ...identity, expiresAt: 9_999, sealedState })
    ).rejects.toThrow();
    const tampered = Uint8Array.from(sealedState);
    tampered[tampered.length - 1]! ^= 1;
    await expect(
      replicaB.open({ ...identity, sealedState: tampered })
    ).rejects.toThrow();
  });

  it('rotates managed keys and rejects old rows after retirement', async () => {
    const records = new Map<string, MemoryRecord>();
    const next = { value: 0 };
    const oldCipher = createManagedRemoteExecutionTerminalStateCipher({
      keyManagementService: createMemoryKms(
        'key-old',
        ['key-old'],
        records,
        next
      ),
      randomBytes: deterministicRandom(),
    });
    const plaintext = Uint8Array.from([1, 2, 3, 4]);
    const oldEnvelope = await oldCipher.seal({ ...identity, plaintext });
    const rotating = createManagedRemoteExecutionTerminalStateCipher({
      keyManagementService: createMemoryKms(
        'key-new',
        ['key-old', 'key-new'],
        records,
        next
      ),
      randomBytes: deterministicRandom(),
    });
    await expect(
      rotating.open({ ...identity, sealedState: oldEnvelope })
    ).resolves.toEqual(plaintext);
    const newEnvelope = await rotating.seal({ ...identity, plaintext });
    const retired = createManagedRemoteExecutionTerminalStateCipher({
      keyManagementService: createMemoryKms(
        'key-new',
        ['key-new'],
        records,
        next
      ),
      randomBytes: deterministicRandom(),
    });
    await expect(
      retired.open({ ...identity, sealedState: newEnvelope })
    ).resolves.toEqual(plaintext);
    await expect(
      retired.open({ ...identity, sealedState: oldEnvelope })
    ).rejects.toThrow();
  });

  it('reads PRT1 only through an explicit migration cipher and writes PRT2', async () => {
    const staticKey = new Uint8Array(32).fill(7);
    const legacy = createAesGcmRemoteExecutionTerminalStateCipher({
      activeKeyId: 'legacy-key',
      keys: [{ keyId: 'legacy-key', key: staticKey }],
      randomBytes: (size) => new Uint8Array(size).fill(2),
    });
    const plaintext = Uint8Array.from([9, 8, 7]);
    const legacyEnvelope = await legacy.seal({ ...identity, plaintext });
    const records = new Map<string, MemoryRecord>();
    const next = { value: 0 };
    const managedKms = createMemoryKms('key-new', ['key-new'], records, next);
    const migrating = createManagedRemoteExecutionTerminalStateCipher({
      keyManagementService: managedKms,
      legacyStaticCipher: legacy,
      randomBytes: deterministicRandom(),
    });
    await expect(
      migrating.open({ ...identity, sealedState: legacyEnvelope })
    ).resolves.toEqual(plaintext);
    const managedEnvelope = await migrating.seal({ ...identity, plaintext });
    expect(Buffer.from(managedEnvelope).subarray(0, 4).toString('ascii')).toBe(
      'PRT2'
    );
    await expect(
      legacy.open({ ...identity, sealedState: managedEnvelope })
    ).rejects.toThrow();
    const withoutMigration = createManagedRemoteExecutionTerminalStateCipher({
      keyManagementService: managedKms,
      randomBytes: deterministicRandom(),
    });
    await expect(
      withoutMigration.open({ ...identity, sealedState: legacyEnvelope })
    ).rejects.toThrow();
  });
});
