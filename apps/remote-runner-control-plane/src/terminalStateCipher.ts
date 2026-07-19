import {
  createCipheriv,
  createDecipheriv,
  randomBytes as nodeRandomBytes,
} from 'node:crypto';
import type { RemoteExecutionTerminalStateCipher } from '@prodivix/runtime-remote';

const envelopeMagic = Buffer.from('PRT1', 'ascii');
const nonceBytes = 12;
const tagBytes = 16;
const maximumKeys = 8;

export type RemoteExecutionTerminalStateKey = Readonly<{
  keyId: string;
  key: Uint8Array;
}>;

export type CreateAesGcmRemoteExecutionTerminalStateCipherInput = Readonly<{
  activeKeyId: string;
  keys: readonly RemoteExecutionTerminalStateKey[];
  randomBytes?: (size: number) => Uint8Array;
}>;

export const isAesGcmRemoteExecutionTerminalStateEnvelope = (
  value: Uint8Array
): boolean =>
  value.byteLength >= envelopeMagic.byteLength &&
  Buffer.from(value.buffer, value.byteOffset, envelopeMagic.byteLength).equals(
    envelopeMagic
  );

const normalizeKeyId = (value: string): string => {
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{0,63}$/u.test(value))
    throw new TypeError('Remote Terminal state key id is invalid.');
  return value;
};

const additionalData = (input: {
  executionId: string;
  terminalSessionId: string;
  revision: number;
  expiresAt: number;
  keyId: string;
}): Buffer => {
  if (
    !input.executionId ||
    input.executionId !== input.executionId.trim() ||
    input.executionId.includes('\0') ||
    !input.terminalSessionId ||
    input.terminalSessionId !== input.terminalSessionId.trim() ||
    input.terminalSessionId.includes('\0') ||
    !Number.isSafeInteger(input.revision) ||
    input.revision < 1 ||
    !Number.isSafeInteger(input.expiresAt) ||
    input.expiresAt < 0
  )
    throw new TypeError('Remote Terminal state cipher identity is invalid.');
  return Buffer.from(
    `prodivix.remote-terminal.state.aes-gcm.v1\0${input.keyId}\0${input.executionId}\0${input.terminalSessionId}\0${input.revision}\0${input.expiresAt}`,
    'utf8'
  );
};

/** AES-256-GCM envelope with key-id and exact identity/revision AAD fences. */
export const createAesGcmRemoteExecutionTerminalStateCipher = (
  input: CreateAesGcmRemoteExecutionTerminalStateCipherInput
): RemoteExecutionTerminalStateCipher => {
  if (!Array.isArray(input.keys) || input.keys.length < 1)
    throw new TypeError('Remote Terminal state key ring must not be empty.');
  if (input.keys.length > maximumKeys)
    throw new TypeError('Remote Terminal state key ring exceeds its budget.');
  const keys = new Map<string, Buffer>();
  input.keys.forEach(({ keyId, key }) => {
    const normalizedKeyId = normalizeKeyId(keyId);
    if (
      keys.has(normalizedKeyId) ||
      !(key instanceof Uint8Array) ||
      key.byteLength !== 32
    )
      throw new TypeError('Remote Terminal state key ring is invalid.');
    keys.set(normalizedKeyId, Buffer.from(key));
  });
  const activeKeyId = normalizeKeyId(input.activeKeyId);
  const activeKey = keys.get(activeKeyId);
  if (!activeKey)
    throw new TypeError('Remote Terminal active state key is unavailable.');
  const randomBytes = input.randomBytes ?? nodeRandomBytes;
  return Object.freeze({
    async seal(value) {
      const nonce = Buffer.from(randomBytes(nonceBytes));
      if (nonce.byteLength !== nonceBytes)
        throw new TypeError('Remote Terminal state nonce is invalid.');
      const keyIdBytes = Buffer.from(activeKeyId, 'utf8');
      const cipher = createCipheriv('aes-256-gcm', activeKey, nonce);
      cipher.setAAD(additionalData({ ...value, keyId: activeKeyId }));
      const ciphertext = Buffer.concat([
        cipher.update(value.plaintext),
        cipher.final(),
      ]);
      return Uint8Array.from(
        Buffer.concat([
          envelopeMagic,
          Buffer.from([keyIdBytes.byteLength]),
          keyIdBytes,
          nonce,
          cipher.getAuthTag(),
          ciphertext,
        ])
      );
    },
    async open(value) {
      const envelope = Buffer.from(value.sealedState);
      if (
        envelope.byteLength <
          envelopeMagic.byteLength + 1 + 1 + nonceBytes + tagBytes ||
        !envelope.subarray(0, envelopeMagic.byteLength).equals(envelopeMagic)
      )
        throw new TypeError('Remote Terminal state envelope is invalid.');
      const keyIdLength = envelope[envelopeMagic.byteLength]!;
      const keyIdStart = envelopeMagic.byteLength + 1;
      const nonceStart = keyIdStart + keyIdLength;
      const tagStart = nonceStart + nonceBytes;
      const ciphertextStart = tagStart + tagBytes;
      if (
        keyIdLength < 1 ||
        ciphertextStart > envelope.byteLength ||
        envelope.byteLength - ciphertextStart < 1
      )
        throw new TypeError('Remote Terminal state envelope is invalid.');
      const keyId = normalizeKeyId(
        envelope.subarray(keyIdStart, nonceStart).toString('utf8')
      );
      const key = keys.get(keyId);
      if (!key)
        throw new TypeError(
          'Remote Terminal state envelope key is unavailable.'
        );
      const decipher = createDecipheriv(
        'aes-256-gcm',
        key,
        envelope.subarray(nonceStart, tagStart)
      );
      decipher.setAAD(additionalData({ ...value, keyId }));
      decipher.setAuthTag(envelope.subarray(tagStart, ciphertextStart));
      return Uint8Array.from(
        Buffer.concat([
          decipher.update(envelope.subarray(ciphertextStart)),
          decipher.final(),
        ])
      );
    },
  });
};
