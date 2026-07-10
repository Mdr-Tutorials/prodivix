export type PluginResourceIntegrityService = {
  digestSha256(bytes: Uint8Array, signal: AbortSignal): Promise<string>;
};

const encodeBase64 = (bytes: Uint8Array): string => {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
};

export const createSha256ResourceIntegrityService =
  (): PluginResourceIntegrityService =>
    Object.freeze({
      digestSha256: async (bytes, signal) => {
        if (signal.aborted) throw new Error('Digest operation was aborted.');
        const digest = await globalThis.crypto.subtle.digest(
          'SHA-256',
          new Uint8Array(bytes)
        );
        if (signal.aborted) throw new Error('Digest operation was aborted.');
        return `sha256-${encodeBase64(new Uint8Array(digest))}`;
      },
    });
