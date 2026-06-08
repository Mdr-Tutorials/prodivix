import { describe, expect, it } from 'vitest';
import { getTranslationStatus } from '../i18nResourceModel';

describe('i18nResourceModel', () => {
  it('prioritizes source missing before target missing', () => {
    expect(
      getTranslationStatus({ source: '', target: '', reviewed: false })
    ).toBe('sourceMissing');
    expect(
      getTranslationStatus({
        source: '  ',
        target: 'Translated',
        reviewed: true,
      })
    ).toBe('sourceMissing');
  });

  it('marks target as missing only when source text exists', () => {
    expect(
      getTranslationStatus({ source: 'Hello', target: '', reviewed: false })
    ).toBe('missing');
  });

  it('separates translated and reviewed target text', () => {
    expect(
      getTranslationStatus({
        source: 'Hello',
        target: '你好',
        reviewed: false,
      })
    ).toBe('translated');
    expect(
      getTranslationStatus({
        source: 'Hello',
        target: '你好',
        reviewed: true,
      })
    ).toBe('reviewed');
  });
});
