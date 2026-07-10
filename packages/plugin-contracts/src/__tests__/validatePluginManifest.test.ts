import { describe, expect, it } from 'vitest';
import {
  BUILT_IN_CONTRIBUTION_POINTS,
  isBuiltInContributionPoint,
  PLUGIN_DIAGNOSTIC_CODES,
  validatePluginManifest,
  type PluginDiagnosticCode,
  type PluginManifestV1,
} from '#contracts/index';
import { createValidManifest } from './fixtures';

const expectDiagnostic = (
  input: unknown,
  code: PluginDiagnosticCode,
  options?: Parameters<typeof validatePluginManifest>[1]
) => {
  const result = validatePluginManifest(input, options);
  expect(result.ok).toBe(false);
  if (result.ok) return;
  expect(result.diagnostics.map((diagnostic) => diagnostic.code)).toContain(
    code
  );
};

describe('validatePluginManifest structure', () => {
  it('accepts a valid programmatic manifest', () => {
    const result = validatePluginManifest(createValidManifest(), {
      hostVersion: '0.8.0',
    });

    expect(result).toEqual({
      ok: true,
      manifest: createValidManifest(),
      diagnostics: [],
    });
  });

  it('accepts the built-in Icon Provider point without coupling it to the Manifest Schema', () => {
    const manifest = createValidManifest();
    manifest.capabilities[0] = {
      id: 'extension.register',
      scope: 'iconProvider',
      reason: 'Register an icon provider contribution.',
    };
    manifest.contributes[0] = {
      ...manifest.contributes[0]!,
      point: 'iconProvider',
    };
    manifest.activationEvents = [
      {
        type: 'contribution.use',
        point: 'iconProvider',
        contributionId: manifest.contributes[0]!.id,
      },
    ];

    const result = validatePluginManifest(manifest);

    expect(result.ok).toBe(true);
    expect(isBuiltInContributionPoint('iconProvider')).toBe(true);
    expect(BUILT_IN_CONTRIBUTION_POINTS).toContain('iconProvider');
    expect(BUILT_IN_CONTRIBUTION_POINTS).toContain('paletteContribution');
  });

  it.each(['IconProvider', 'icon provider', 'icon/provider', 'icon..provider'])(
    'rejects a non-canonical contribution point %s',
    (point) => {
      const manifest = createValidManifest() as unknown as {
        capabilities: Array<Record<string, unknown>>;
        contributes: Array<Record<string, unknown>>;
      };
      manifest.capabilities[0]!.scope = point;
      manifest.contributes[0]!.point = point;

      expectDiagnostic(manifest, PLUGIN_DIAGNOSTIC_CODES.SCHEMA_VIOLATION);
    }
  );

  it('rejects Schema violations with a stable field path', () => {
    const manifest = createValidManifest() as unknown as Record<
      string,
      unknown
    >;
    delete manifest.publisher;

    const result = validatePluginManifest(manifest);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: PLUGIN_DIAGNOSTIC_CODES.SCHEMA_VIOLATION,
          meta: expect.objectContaining({ manifestPath: '/publisher' }),
        }),
      ])
    );
  });

  it.each([
    new Date('2026-01-01T00:00:00Z'),
    new Map([['key', 'value']]),
    { value: Number.POSITIVE_INFINITY },
    { value: undefined },
  ])('rejects non-JSON programmatic values', (input) => {
    expectDiagnostic(input, PLUGIN_DIAGNOSTIC_CODES.NON_JSON_VALUE);
  });

  it('rejects cyclic programmatic values', () => {
    const input: Record<string, unknown> = {};
    input.self = input;

    expectDiagnostic(input, PLUGIN_DIAGNOSTIC_CODES.NON_JSON_VALUE);
  });
});

describe('validatePluginManifest semantics', () => {
  it('validates plugin SemVer, engine ranges, and host compatibility', () => {
    const invalidVersion = createValidManifest();
    invalidVersion.version = '1.0.0-01';
    expectDiagnostic(
      invalidVersion,
      PLUGIN_DIAGNOSTIC_CODES.INVALID_PLUGIN_VERSION
    );

    const invalidRange = createValidManifest();
    invalidRange.engines.prodivix = 'not-a-range';
    expectDiagnostic(
      invalidRange,
      PLUGIN_DIAGNOSTIC_CODES.INVALID_ENGINE_RANGE
    );

    expectDiagnostic(
      createValidManifest(),
      PLUGIN_DIAGNOSTIC_CODES.INCOMPATIBLE_HOST,
      { hostVersion: '2.0.0' }
    );
  });

  it('requires a scoped plugin publisher to match its npm scope', () => {
    const manifest = createValidManifest();
    manifest.publisher = 'another-publisher';

    expectDiagnostic(
      manifest,
      PLUGIN_DIAGNOSTIC_CODES.PUBLISHER_SCOPE_MISMATCH
    );
  });

  it('rejects duplicate capabilities and contribution ids', () => {
    const duplicateCapability = createValidManifest();
    duplicateCapability.capabilities.push({
      ...duplicateCapability.capabilities[0]!,
    });
    expectDiagnostic(
      duplicateCapability,
      PLUGIN_DIAGNOSTIC_CODES.DUPLICATE_CAPABILITY
    );

    const duplicateContribution = createValidManifest();
    duplicateContribution.contributes.push({
      ...duplicateContribution.contributes[0]!,
      source: {
        kind: 'resource',
        path: './contributions/duplicate.json',
      },
    });
    expectDiagnostic(
      duplicateContribution,
      PLUGIN_DIAGNOSTIC_CODES.DUPLICATE_CONTRIBUTION
    );
  });

  it('requires extension.register for every contribution point', () => {
    const manifest = createValidManifest();
    manifest.capabilities = [];

    expectDiagnostic(
      manifest,
      PLUGIN_DIAGNOSTIC_CODES.MISSING_REGISTRATION_CAPABILITY
    );
  });

  it('validates contribution and host command activation references', () => {
    const missingContribution = createValidManifest();
    missingContribution.activationEvents = [
      {
        type: 'contribution.use',
        point: 'paletteContribution',
        contributionId: 'missing.palette',
      },
    ];
    expectDiagnostic(
      missingContribution,
      PLUGIN_DIAGNOSTIC_CODES.INVALID_ACTIVATION_REFERENCE
    );

    const missingCommand = createValidManifest();
    missingCommand.activationEvents = [
      { type: 'command', commandId: 'example.missing-command' },
    ];
    expectDiagnostic(
      missingCommand,
      PLUGIN_DIAGNOSTIC_CODES.INVALID_ACTIVATION_REFERENCE,
      { knownCommandIds: ['example.known-command'] }
    );

    expect(validatePluginManifest(missingCommand).ok).toBe(true);
  });

  it('requires a runtime entrypoint whenever activation events exist', () => {
    const manifest = createValidManifest();
    manifest.entrypoints = {
      ui: [{ id: 'panel', path: './ui/panel.html' }],
    };

    expectDiagnostic(
      manifest,
      PLUGIN_DIAGNOSTIC_CODES.MISSING_RUNTIME_ENTRYPOINT
    );
  });

  it('rejects reserved and case-colliding resource paths', () => {
    const reservedPath = createValidManifest();
    reservedPath.contributes[0] = {
      ...reservedPath.contributes[0]!,
      source: { kind: 'resource', path: './NUL.json' },
    };
    expectDiagnostic(
      reservedPath,
      PLUGIN_DIAGNOSTIC_CODES.INVALID_RESOURCE_PATH
    );

    const collidingPath = createValidManifest();
    collidingPath.icon = './DIST/runtime.js';
    expectDiagnostic(
      collidingPath,
      PLUGIN_DIAGNOSTIC_CODES.INVALID_RESOURCE_PATH
    );
  });

  it('rejects duplicate UI entrypoint ids', () => {
    const manifest: PluginManifestV1 = createValidManifest();
    manifest.entrypoints = {
      ...manifest.entrypoints,
      ui: [
        { id: 'panel', path: './ui/first.html' },
        { id: 'panel', path: './ui/second.html' },
      ],
    };

    expectDiagnostic(manifest, PLUGIN_DIAGNOSTIC_CODES.DUPLICATE_UI_ENTRYPOINT);
  });
});
