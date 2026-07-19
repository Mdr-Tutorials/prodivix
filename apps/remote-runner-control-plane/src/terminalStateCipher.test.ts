import { describe, expect, it } from 'vitest';
import { createAesGcmRemoteExecutionTerminalStateCipher } from './terminalStateCipher';

const firstKey = Uint8Array.from({ length: 32 }, (_, index) => index + 1);
const secondKey = Uint8Array.from({ length: 32 }, (_, index) => 255 - index);
const identity = {
  executionId: 'execution-1',
  terminalSessionId: 'terminal-1',
  revision: 7,
  expiresAt: 10_000,
};

describe('Remote Terminal AES-GCM state cipher', () => {
  it('binds ciphertext to session identity/revision and detects tampering', async () => {
    let nonce = 0;
    const cipher = createAesGcmRemoteExecutionTerminalStateCipher({
      activeKeyId: 'key-1',
      keys: [{ keyId: 'key-1', key: firstKey }],
      randomBytes: (size) => new Uint8Array(size).fill(++nonce),
    });
    const plaintext = Buffer.from('stdin=secret-canary', 'utf8');
    const sealedState = await cipher.seal({ ...identity, plaintext });
    expect(Buffer.from(sealedState).includes(plaintext)).toBe(false);
    await expect(cipher.open({ ...identity, sealedState })).resolves.toEqual(
      Uint8Array.from(plaintext)
    );
    await expect(
      cipher.open({ ...identity, revision: 8, sealedState })
    ).rejects.toThrow();
    await expect(
      cipher.open({ ...identity, expiresAt: 9_999, sealedState })
    ).rejects.toThrow();
    const tampered = Uint8Array.from(sealedState);
    tampered[tampered.length - 1]! ^= 1;
    await expect(
      cipher.open({ ...identity, sealedState: tampered })
    ).rejects.toThrow();
  });

  it('reads an old key after rotation while sealing only with the active key', async () => {
    const oldCipher = createAesGcmRemoteExecutionTerminalStateCipher({
      activeKeyId: 'key-old',
      keys: [{ keyId: 'key-old', key: firstKey }],
      randomBytes: (size) => new Uint8Array(size).fill(3),
    });
    const plaintext = Uint8Array.from([1, 2, 3, 4]);
    const oldEnvelope = await oldCipher.seal({ ...identity, plaintext });
    const rotated = createAesGcmRemoteExecutionTerminalStateCipher({
      activeKeyId: 'key-new',
      keys: [
        { keyId: 'key-new', key: secondKey },
        { keyId: 'key-old', key: firstKey },
      ],
      randomBytes: (size) => new Uint8Array(size).fill(4),
    });
    await expect(
      rotated.open({ ...identity, sealedState: oldEnvelope })
    ).resolves.toEqual(plaintext);
    const newEnvelope = await rotated.seal({ ...identity, plaintext });
    await expect(
      oldCipher.open({ ...identity, sealedState: newEnvelope })
    ).rejects.toThrow(/key is unavailable/u);
  });
});
