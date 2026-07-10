import { describe, expect, it } from 'vitest';
import {
  parseAndValidatePluginManifest,
  parsePluginManifest,
  parseStrictJsonDocument,
  PLUGIN_DIAGNOSTIC_CODES,
} from '#contracts/index';
import { createValidManifest } from './fixtures';

const diagnosticCodes = (
  result: ReturnType<typeof parsePluginManifest>
): string[] => (result.ok ? [] : result.diagnostics.map(({ code }) => code));

describe('parsePluginManifest', () => {
  it('parses strict JSON and preserves the exact UTF-8 bytes', () => {
    const source = JSON.stringify(createValidManifest());

    const result = parsePluginManifest(source);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toEqual(createValidManifest());
    expect(result.sourceBytes).toEqual(new TextEncoder().encode(source));
  });

  it('rejects invalid UTF-8 and byte order marks', () => {
    const invalidUtf8 = parsePluginManifest(
      new Uint8Array([0x7b, 0x22, 0xc3, 0x28, 0x22, 0x7d])
    );
    const withBom = parsePluginManifest(
      new Uint8Array([0xef, 0xbb, 0xbf, 0x7b, 0x7d])
    );

    expect(diagnosticCodes(invalidUtf8)).toContain(
      PLUGIN_DIAGNOSTIC_CODES.INVALID_SOURCE
    );
    expect(diagnosticCodes(withBom)).toContain(
      PLUGIN_DIAGNOSTIC_CODES.INVALID_SOURCE
    );
  });

  it.each(['{"id":"example",}', '{/* comment */"id":"example"}', '{"id":}'])(
    'rejects non-standard or malformed JSON: %s',
    (source) => {
      const result = parsePluginManifest(source);

      expect(diagnosticCodes(result)).toContain(
        PLUGIN_DIAGNOSTIC_CODES.INVALID_SOURCE
      );
    }
  );

  it('reports duplicate object keys at a stable JSON pointer', () => {
    const result = parsePluginManifest('{"id":"first","id":"second"}');

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: PLUGIN_DIAGNOSTIC_CODES.DUPLICATE_KEY,
          meta: expect.objectContaining({ manifestPath: '/id' }),
        }),
      ])
    );
  });

  it('enforces byte and nesting limits', () => {
    const oversized = parsePluginManifest('{}', { maxBytes: 1 });
    const tooDeep = parsePluginManifest('{"a":{"b":{"c":true}}}', {
      maxDepth: 2,
    });

    expect(diagnosticCodes(oversized)).toContain(
      PLUGIN_DIAGNOSTIC_CODES.RESOURCE_LIMIT
    );
    expect(diagnosticCodes(tooDeep)).toContain(
      PLUGIN_DIAGNOSTIC_CODES.RESOURCE_LIMIT
    );
  });
});

describe('parseStrictJsonDocument', () => {
  it('uses contribution-specific diagnostics and preserves resource context', () => {
    const result = parseStrictJsonDocument('{"id":"first","id":"second"}', {
      documentKind: 'contribution',
      diagnosticMeta: {
        pluginId: '@prodivix/plugin-example',
        contributionId: 'example.palette',
        resourcePath: './contributions/palette.json',
      },
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: PLUGIN_DIAGNOSTIC_CODES.INVALID_CONTRIBUTION_JSON,
          meta: expect.objectContaining({
            pluginId: '@prodivix/plugin-example',
            contributionId: 'example.palette',
            resourcePath: './contributions/palette.json',
            documentPath: '/id',
          }),
        }),
      ])
    );
  });

  it('uses a distinct contribution resource-limit diagnostic', () => {
    const result = parseStrictJsonDocument('{}', {
      documentKind: 'contribution',
      maxBytes: 1,
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.diagnostics[0]?.code).toBe(
      PLUGIN_DIAGNOSTIC_CODES.CONTRIBUTION_RESOURCE_LIMIT
    );
  });
});

describe('parseAndValidatePluginManifest', () => {
  it('returns a typed manifest after both validation stages pass', () => {
    const source = JSON.stringify(createValidManifest());

    const result = parseAndValidatePluginManifest(source, {
      hostVersion: '0.5.0',
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.manifest.id).toBe('@prodivix/plugin-example');
    expect(result.diagnostics).toEqual([]);
  });
});
