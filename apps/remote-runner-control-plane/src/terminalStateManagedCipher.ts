import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes as nodeRandomBytes,
} from 'node:crypto';
import { TextDecoder } from 'node:util';
import type { RemoteExecutionTerminalStateCipher } from '@prodivix/runtime-remote';
import { isAesGcmRemoteExecutionTerminalStateEnvelope } from './terminalStateCipher';

const envelopeMagic = Buffer.from('PRT2', 'ascii');
const dataKeyBytes = 32;
const nonceBytes = 12;
const tagBytes = 16;
const maximumProviderIdBytes = 32;
const maximumKeyIdBytes = 64;
const maximumMetadataBytes = 512;
// Leaves the PRT2 envelope inside runtime-remote's plaintext + 4 KiB hard cap.
const maximumWrappedKeyBytes = 3 * 1_024;
const maximumIdentityBytes = 16 * 1_024;
const decoder = new TextDecoder('utf-8', { fatal: true });

export type RemoteExecutionTerminalStateWrappedDataKey = Readonly<{
  keyId: string;
  metadata: Uint8Array;
  wrappedKey: Uint8Array;
}>;

export type RemoteExecutionTerminalStateKeyManagementService = Readonly<{
  providerId: string;
  activeKeyId: string;
  wrapDataKey(input: {
    dataKey: Uint8Array;
    additionalData: Uint8Array;
  }): Promise<RemoteExecutionTerminalStateWrappedDataKey>;
  unwrapDataKey(
    input: RemoteExecutionTerminalStateWrappedDataKey & {
      additionalData: Uint8Array;
    }
  ): Promise<Uint8Array>;
}>;

export type CreateManagedRemoteExecutionTerminalStateCipherInput = Readonly<{
  keyManagementService: RemoteExecutionTerminalStateKeyManagementService;
  legacyStaticCipher?: RemoteExecutionTerminalStateCipher;
  randomBytes?: (size: number) => Uint8Array;
}>;

type StateIdentity = Readonly<{
  executionId: string;
  terminalSessionId: string;
  revision: number;
  expiresAt: number;
}>;

type ParsedEnvelope = Readonly<{
  providerId: string;
  keyId: string;
  metadata: Uint8Array;
  wrappedKey: Uint8Array;
  nonce: Uint8Array;
  tag: Uint8Array;
  ciphertext: Uint8Array;
}>;

const normalizeProviderId = (value: string): string => {
  if (!/^[a-z][a-z0-9.-]{1,23}\/v[1-9][0-9]{0,3}$/u.test(value))
    throw new TypeError('Remote Terminal state KMS provider is invalid.');
  return value;
};

const normalizeKeyId = (value: string): string => {
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{0,63}$/u.test(value))
    throw new TypeError('Remote Terminal state KMS key id is invalid.');
  return value;
};

const normalizeIdentity = (input: StateIdentity): StateIdentity => {
  if (
    !input.executionId ||
    input.executionId !== input.executionId.trim() ||
    input.executionId.includes('\0') ||
    Buffer.byteLength(input.executionId, 'utf8') > 4_096 ||
    !input.terminalSessionId ||
    input.terminalSessionId !== input.terminalSessionId.trim() ||
    input.terminalSessionId.includes('\0') ||
    Buffer.byteLength(input.terminalSessionId, 'utf8') > 4_096 ||
    !Number.isSafeInteger(input.revision) ||
    input.revision < 1 ||
    !Number.isSafeInteger(input.expiresAt) ||
    input.expiresAt < 0
  )
    throw new TypeError('Remote Terminal state cipher identity is invalid.');
  return input;
};

const dataKeyAdditionalData = (
  identity: StateIdentity,
  providerId: string,
  keyId: string
): Buffer => {
  const value = Buffer.from(
    `prodivix.remote-terminal.state.data-key.v2\0${providerId}\0${keyId}\0${identity.executionId}\0${identity.terminalSessionId}\0${identity.revision}\0${identity.expiresAt}`,
    'utf8'
  );
  if (value.byteLength > maximumIdentityBytes)
    throw new TypeError('Remote Terminal state cipher identity is too large.');
  return value;
};

const stateAdditionalData = (
  keyAdditionalData: Uint8Array,
  metadata: Uint8Array,
  wrappedKey: Uint8Array
): Buffer => {
  const envelopeDigest = createHash('sha256')
    .update('prodivix.remote-terminal.state.wrapped-data-key.v2')
    .update(Buffer.from([0]))
    .update(metadata)
    .update(Buffer.from([0]))
    .update(wrappedKey)
    .digest('hex');
  return Buffer.concat([
    Buffer.from(keyAdditionalData),
    Buffer.from(`\0${envelopeDigest}`, 'utf8'),
  ]);
};

const boundedBytes = (
  value: Uint8Array,
  name: string,
  minimum: number,
  maximum: number
): Uint8Array => {
  if (
    !(value instanceof Uint8Array) ||
    value.byteLength < minimum ||
    value.byteLength > maximum
  )
    throw new TypeError(`Remote Terminal state ${name} is invalid.`);
  return Uint8Array.from(value);
};

const readString = (value: Uint8Array, name: string): string => {
  try {
    return decoder.decode(value);
  } catch {
    throw new TypeError(`Remote Terminal state ${name} is invalid.`);
  }
};

const parseEnvelope = (value: Uint8Array): ParsedEnvelope => {
  const envelope = Buffer.from(value);
  const fixedHeaderBytes = envelopeMagic.byteLength + 1 + 1 + 2 + 2;
  if (
    envelope.byteLength <
      fixedHeaderBytes + 1 + 1 + 1 + 1 + nonceBytes + tagBytes + 1 ||
    !envelope.subarray(0, envelopeMagic.byteLength).equals(envelopeMagic)
  )
    throw new TypeError('Remote Terminal managed state envelope is invalid.');
  let offset = envelopeMagic.byteLength;
  const providerIdLength = envelope[offset++]!;
  const keyIdLength = envelope[offset++]!;
  const metadataLength = envelope.readUInt16BE(offset);
  offset += 2;
  const wrappedKeyLength = envelope.readUInt16BE(offset);
  offset += 2;
  if (
    providerIdLength < 1 ||
    providerIdLength > maximumProviderIdBytes ||
    keyIdLength < 1 ||
    keyIdLength > maximumKeyIdBytes ||
    metadataLength < 1 ||
    metadataLength > maximumMetadataBytes ||
    wrappedKeyLength < 1 ||
    wrappedKeyLength > maximumWrappedKeyBytes
  )
    throw new TypeError('Remote Terminal managed state envelope is invalid.');
  const requiredBytes =
    offset +
    providerIdLength +
    keyIdLength +
    metadataLength +
    wrappedKeyLength +
    nonceBytes +
    tagBytes +
    1;
  if (requiredBytes > envelope.byteLength)
    throw new TypeError('Remote Terminal managed state envelope is invalid.');
  const take = (length: number): Uint8Array => {
    const result = Uint8Array.from(envelope.subarray(offset, offset + length));
    offset += length;
    return result;
  };
  const providerId = normalizeProviderId(
    readString(take(providerIdLength), 'KMS provider')
  );
  const keyId = normalizeKeyId(readString(take(keyIdLength), 'KMS key id'));
  const metadata = take(metadataLength);
  const wrappedKey = take(wrappedKeyLength);
  const nonce = take(nonceBytes);
  const tag = take(tagBytes);
  const ciphertext = take(envelope.byteLength - offset);
  return Object.freeze({
    providerId,
    keyId,
    metadata,
    wrappedKey,
    nonce,
    tag,
    ciphertext,
  });
};

const encodeEnvelope = (input: ParsedEnvelope): Uint8Array => {
  const providerId = Buffer.from(input.providerId, 'utf8');
  const keyId = Buffer.from(input.keyId, 'utf8');
  const lengths = Buffer.alloc(6);
  lengths[0] = providerId.byteLength;
  lengths[1] = keyId.byteLength;
  lengths.writeUInt16BE(input.metadata.byteLength, 2);
  lengths.writeUInt16BE(input.wrappedKey.byteLength, 4);
  return Uint8Array.from(
    Buffer.concat([
      envelopeMagic,
      lengths,
      providerId,
      keyId,
      input.metadata,
      input.wrappedKey,
      input.nonce,
      input.tag,
      input.ciphertext,
    ])
  );
};

export const createManagedRemoteExecutionTerminalStateCipher = (
  input: CreateManagedRemoteExecutionTerminalStateCipherInput
): RemoteExecutionTerminalStateCipher => {
  const keyManagementService = input.keyManagementService;
  const providerId = normalizeProviderId(keyManagementService.providerId);
  const activeKeyId = normalizeKeyId(keyManagementService.activeKeyId);
  const randomBytes = input.randomBytes ?? nodeRandomBytes;
  return Object.freeze({
    async seal(value) {
      const identity = normalizeIdentity(value);
      const dataKey = Buffer.from(randomBytes(dataKeyBytes));
      const nonce = Buffer.from(randomBytes(nonceBytes));
      if (
        dataKey.byteLength !== dataKeyBytes ||
        nonce.byteLength !== nonceBytes
      ) {
        dataKey.fill(0);
        throw new TypeError(
          'Remote Terminal managed state randomness is invalid.'
        );
      }
      try {
        const keyAAD = dataKeyAdditionalData(identity, providerId, activeKeyId);
        const wrapped = await keyManagementService.wrapDataKey({
          dataKey,
          additionalData: keyAAD,
        });
        const keyId = normalizeKeyId(wrapped.keyId);
        if (keyId !== activeKeyId)
          throw new TypeError('Remote Terminal managed state key drifted.');
        const metadata = boundedBytes(
          wrapped.metadata,
          'wrapped-key metadata',
          1,
          maximumMetadataBytes
        );
        const wrappedKey = boundedBytes(
          wrapped.wrappedKey,
          'wrapped key',
          1,
          maximumWrappedKeyBytes
        );
        const cipher = createCipheriv('aes-256-gcm', dataKey, nonce);
        cipher.setAAD(stateAdditionalData(keyAAD, metadata, wrappedKey));
        const ciphertext = Buffer.concat([
          cipher.update(value.plaintext),
          cipher.final(),
        ]);
        if (ciphertext.byteLength < 1)
          throw new TypeError('Remote Terminal managed state is empty.');
        return encodeEnvelope({
          providerId,
          keyId,
          metadata,
          wrappedKey,
          nonce,
          tag: cipher.getAuthTag(),
          ciphertext,
        });
      } finally {
        dataKey.fill(0);
      }
    },
    async open(value) {
      const identity = normalizeIdentity(value);
      if (
        input.legacyStaticCipher &&
        isAesGcmRemoteExecutionTerminalStateEnvelope(value.sealedState)
      )
        return input.legacyStaticCipher.open(value);
      const envelope = parseEnvelope(value.sealedState);
      if (envelope.providerId !== providerId)
        throw new TypeError('Remote Terminal managed state provider drifted.');
      const keyAAD = dataKeyAdditionalData(
        identity,
        providerId,
        envelope.keyId
      );
      const unwrapped = await keyManagementService.unwrapDataKey({
        keyId: envelope.keyId,
        metadata: envelope.metadata,
        wrappedKey: envelope.wrappedKey,
        additionalData: keyAAD,
      });
      const dataKey = Buffer.from(unwrapped);
      if (unwrapped instanceof Uint8Array) unwrapped.fill(0);
      if (dataKey.byteLength !== dataKeyBytes) {
        dataKey.fill(0);
        throw new TypeError('Remote Terminal managed data key is invalid.');
      }
      try {
        const decipher = createDecipheriv(
          'aes-256-gcm',
          dataKey,
          envelope.nonce
        );
        decipher.setAAD(
          stateAdditionalData(keyAAD, envelope.metadata, envelope.wrappedKey)
        );
        decipher.setAuthTag(envelope.tag);
        return Uint8Array.from(
          Buffer.concat([
            decipher.update(envelope.ciphertext),
            decipher.final(),
          ])
        );
      } finally {
        dataKey.fill(0);
      }
    },
  });
};
