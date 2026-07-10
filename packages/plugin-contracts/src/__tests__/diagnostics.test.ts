import { describe, expect, it } from 'vitest';
import {
  createPluginDiagnostic,
  PLUGIN_DIAGNOSTIC_CODES,
  PLUGIN_DIAGNOSTIC_DEFINITIONS,
} from '#contracts/diagnostics';

describe('plugin diagnostic definitions', () => {
  it('keeps every code unique and paired with one machine-readable definition', () => {
    const codes = Object.values(PLUGIN_DIAGNOSTIC_CODES);

    expect(new Set(codes).size).toBe(codes.length);
    expect(Object.keys(PLUGIN_DIAGNOSTIC_DEFINITIONS).sort()).toEqual(
      [...codes].sort()
    );
    for (const code of codes) {
      expect(PLUGIN_DIAGNOSTIC_DEFINITIONS[code].code).toBe(code);
    }
  });

  it('preserves the Phase 4 Gateway, quota, and audit classifications', () => {
    expect(
      PLUGIN_DIAGNOSTIC_DEFINITIONS[
        PLUGIN_DIAGNOSTIC_CODES.GATEWAY_CAPABILITY_DENIED
      ]
    ).toMatchObject({ stage: 'permission', retryable: false });
    expect(
      PLUGIN_DIAGNOSTIC_DEFINITIONS[
        PLUGIN_DIAGNOSTIC_CODES.GATEWAY_NETWORK_POLICY_DENIED
      ]
    ).toMatchObject({ stage: 'network', retryable: false });
    expect(
      PLUGIN_DIAGNOSTIC_DEFINITIONS[
        PLUGIN_DIAGNOSTIC_CODES.GATEWAY_QUOTA_EXCEEDED
      ]
    ).toMatchObject({ stage: 'quota', retryable: false });
    expect(
      PLUGIN_DIAGNOSTIC_DEFINITIONS[
        PLUGIN_DIAGNOSTIC_CODES.GATEWAY_AUDIT_WRITE_FAILED
      ]
    ).toMatchObject({
      stage: 'audit',
      severity: 'warning',
      retryable: true,
    });
  });

  it('builds stable docs URLs without exposing unsafe metadata', () => {
    const diagnostic = createPluginDiagnostic(
      PLUGIN_DIAGNOSTIC_CODES.GATEWAY_REQUEST_INVALID,
      'Gateway request is invalid.',
      { protocolMethod: 'document/read', contractVersion: '1.0' }
    );

    expect(diagnostic).toMatchObject({
      code: 'PLG-4032',
      docsUrl: '/reference/diagnostics/plg-4032',
      meta: {
        stage: 'gateway',
        protocolMethod: 'document/read',
        contractVersion: '1.0',
      },
    });
    expect(JSON.stringify(diagnostic)).not.toMatch(/secret|token|body/i);
  });
});
