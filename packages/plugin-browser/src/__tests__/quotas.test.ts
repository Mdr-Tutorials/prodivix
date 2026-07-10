import { describe, expect, it } from 'vitest';
import {
  createTokenBucket,
  normalizeBrowserPluginQuotaPolicy,
} from '#browser/index';

describe('browser plugin quota policy', () => {
  it('normalizes invalid values to bounded defaults', () => {
    const policy = normalizeBrowserPluginQuotaPolicy({
      maxMessageBytes: 0,
      heartbeatMissLimit: Number.NaN,
    });

    expect(policy.maxMessageBytes).toBe(256 * 1024);
    expect(policy.heartbeatMissLimit).toBe(3);
  });

  it('uses a refilling token bucket with a finite burst', () => {
    let current = 0;
    const bucket = createTokenBucket(2, 2, () => current);

    expect(bucket.consume()).toBe(true);
    expect(bucket.consume()).toBe(true);
    expect(bucket.consume()).toBe(false);
    current = 500;
    expect(bucket.consume()).toBe(true);
    expect(bucket.consume()).toBe(false);
  });
});
