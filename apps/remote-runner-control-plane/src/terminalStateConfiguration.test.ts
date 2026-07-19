import { describe, expect, it } from 'vitest';
import {
  readRemoteTerminalStateCipherConfiguration,
  REMOTE_TERMINAL_STATE_KMS_PROVIDER_AWS,
  REMOTE_TERMINAL_STATE_KMS_PROVIDER_STATIC,
} from './terminalStateConfiguration';

const encodedKey = (value: number): string =>
  Buffer.alloc(32, value).toString('base64');

const activeKeyArn =
  'arn:aws:kms:us-east-1:111122223333:key/77777777-7777-7777-7777-777777777777';

describe('Remote Terminal state cipher configuration', () => {
  it('keeps the existing static key ring as the explicit default', () => {
    const configuration = readRemoteTerminalStateCipherConfiguration({
      REMOTE_TERMINAL_STATE_ACTIVE_KEY_ID: 'key-active',
      REMOTE_TERMINAL_STATE_KEYS_JSON: JSON.stringify({
        'key-active': encodedKey(7),
      }),
    });
    expect(configuration).toMatchObject({
      provider: REMOTE_TERMINAL_STATE_KMS_PROVIDER_STATIC,
      activeKeyId: 'key-active',
    });
    expect(configuration.encodedSecretValues).toEqual([encodedKey(7)]);
  });

  it('selects AWS KMS and treats static keys as decrypt-only migration material', () => {
    const configuration = readRemoteTerminalStateCipherConfiguration({
      REMOTE_TERMINAL_STATE_KMS_PROVIDER: 'aws-kms',
      REMOTE_TERMINAL_STATE_ACTIVE_KEY_ID: 'key-cloud',
      REMOTE_TERMINAL_STATE_KMS_AWS_REGION: 'us-east-1',
      REMOTE_TERMINAL_STATE_KMS_AWS_KEY_ARNS_JSON: JSON.stringify({
        'key-cloud': activeKeyArn,
      }),
      REMOTE_TERMINAL_STATE_KMS_TIMEOUT_MS: '2500',
      REMOTE_TERMINAL_STATE_KEYS_JSON: JSON.stringify({
        'key-static': encodedKey(3),
      }),
    });
    expect(configuration).toMatchObject({
      provider: REMOTE_TERMINAL_STATE_KMS_PROVIDER_AWS,
      activeKeyId: 'key-cloud',
      region: 'us-east-1',
      operationTimeoutMs: 2_500,
      keyArns: { 'key-cloud': activeKeyArn },
    });
    if (configuration.provider !== REMOTE_TERMINAL_STATE_KMS_PROVIDER_AWS)
      throw new Error('expected AWS KMS configuration');
    expect(configuration.legacyStaticKeys).toHaveLength(1);
    expect(configuration.encodedSecretValues).toEqual([encodedKey(3)]);
  });

  it('fails closed on provider, key, timeout, and canonical base64 drift', () => {
    const base = {
      REMOTE_TERMINAL_STATE_KMS_PROVIDER: 'aws-kms',
      REMOTE_TERMINAL_STATE_ACTIVE_KEY_ID: 'key-cloud',
      REMOTE_TERMINAL_STATE_KMS_AWS_REGION: 'us-east-1',
      REMOTE_TERMINAL_STATE_KMS_AWS_KEY_ARNS_JSON: JSON.stringify({
        'key-cloud': activeKeyArn,
      }),
    };
    expect(() =>
      readRemoteTerminalStateCipherConfiguration({
        ...base,
        REMOTE_TERMINAL_STATE_KMS_PROVIDER: 'unknown',
      })
    ).toThrow(/unsupported/u);
    expect(() =>
      readRemoteTerminalStateCipherConfiguration({
        ...base,
        REMOTE_TERMINAL_STATE_ACTIVE_KEY_ID: 'missing',
      })
    ).toThrow(/not present/u);
    expect(() =>
      readRemoteTerminalStateCipherConfiguration({
        ...base,
        REMOTE_TERMINAL_STATE_KMS_TIMEOUT_MS: '30001',
      })
    ).toThrow(/between/u);
    expect(() =>
      readRemoteTerminalStateCipherConfiguration({
        REMOTE_TERMINAL_STATE_ACTIVE_KEY_ID: 'key-static',
        REMOTE_TERMINAL_STATE_KEYS_JSON: JSON.stringify({
          'key-static': Buffer.alloc(31).toString('base64'),
        }),
      })
    ).toThrow(/canonical/u);
  });
});
