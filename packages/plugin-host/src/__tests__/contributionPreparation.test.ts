import { describe, expect, it } from 'vitest';
import {
  createPluginDiagnostic,
  PLUGIN_DIAGNOSTIC_CODES,
  type JsonValue,
  type PluginManifestV1,
} from '@prodivix/plugin-contracts';
import { resolvePermissionSnapshot } from '#host/capability/permissionResolution';
import { defineContributionContract } from '#host/contribution/contributionContract';
import { createContributionContractRegistry } from '#host/contribution/contributionContractRegistry';
import {
  DEFAULT_PLUGIN_CONTRIBUTION_RESOURCE_LIMITS,
  loadAndValidateContributionDescriptors,
  prepareValidatedContributions,
} from '#host/contribution/contributionPreparation';
import { createPluginOwnerRef } from '#host/identity';
import { pluginHostFailure, pluginHostSuccess } from '#host/result';

type TestContributionMap = {
  paletteContribution: Readonly<{ label: string }>;
};

const owner = createPluginOwnerRef(
  '@prodivix/plugin-preparation-test',
  'installation-1',
  1
);

const createManifest = (
  source: PluginManifestV1['contributes'][number]['source']
): PluginManifestV1 => ({
  schemaVersion: '1.0',
  id: owner.pluginId,
  displayName: 'Preparation test plugin',
  version: '1.0.0',
  publisher: 'prodivix',
  engines: { prodivix: '>=0.1.0 <1.0.0' },
  capabilities: [
    {
      id: 'extension.register',
      scope: 'paletteContribution',
      reason: 'Register test palette items.',
    },
  ],
  contributes: [
    {
      id: 'test.palette',
      point: 'paletteContribution',
      contractVersion: '1.0',
      source,
    },
  ],
});

const createPermission = (manifest: PluginManifestV1, granted = true) => {
  const result = resolvePermissionSnapshot({
    owner,
    pluginVersion: manifest.version,
    requests: manifest.capabilities,
    decisions: [
      {
        capability: {
          id: 'extension.register',
          scope: 'paletteContribution',
        },
        decision: granted ? 'grant' : 'deny',
        source: 'administrator',
        reasonCode: granted ? 'test-grant' : 'test-deny',
      },
    ],
    permissionRevision: 1,
    policyRevision: 'policy-1',
    policySource: 'test',
  });
  if (!result.ok) throw new Error('Test permission must resolve.');
  return result.value;
};

const contract = defineContributionContract<
  TestContributionMap,
  'paletteContribution',
  JsonValue
>({
  point: 'paletteContribution',
  contractVersion: '1.0',
  validateDescriptor: (input) => {
    if (
      typeof input === 'object' &&
      input !== null &&
      !Array.isArray(input) &&
      typeof input.label === 'string'
    ) {
      return pluginHostSuccess(input);
    }
    return pluginHostFailure([
      createPluginDiagnostic(
        PLUGIN_DIAGNOSTIC_CODES.CONTRIBUTION_SCHEMA_VIOLATION,
        'Test descriptor requires a label.',
        { contributionPoint: 'paletteContribution' }
      ),
    ]);
  },
  prepare: async ({ descriptor }) => {
    const label =
      typeof descriptor === 'object' &&
      descriptor !== null &&
      !Array.isArray(descriptor) &&
      typeof descriptor.label === 'string'
        ? descriptor.label
        : '';
    return pluginHostSuccess({
      value: { label },
      lifetime: 'installation',
      dependsOnCapabilities: [],
    });
  },
});

const registryResult = createContributionContractRegistry([contract]);
if (!registryResult.ok) throw new Error('Test contract registry must resolve.');
const contracts = registryResult.value;

const createLoadContext = (
  manifest: PluginManifestV1,
  bytes: Uint8Array,
  options: { granted?: boolean; integrityMatches?: boolean } = {}
) => ({
  owner,
  manifest,
  permission: createPermission(manifest, options.granted ?? true),
  reader: {
    readManifest: async () => pluginHostSuccess(new Uint8Array()),
    readResource: async () => pluginHostSuccess(bytes),
  },
  contracts,
  integrityService: {
    digestSha256: async () =>
      options.integrityMatches === false
        ? 'sha256-BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB='
        : manifest.contributes[0]?.source.kind === 'resource'
          ? (manifest.contributes[0].source.integrity ??
            'sha256-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=')
          : 'sha256-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
  },
  limits: DEFAULT_PLUGIN_CONTRIBUTION_RESOURCE_LIMITS,
  operationId: 'operation-1',
  signal: new AbortController().signal,
});

describe('contribution preparation', () => {
  it('loads strict resource JSON and prepares a Host value', async () => {
    const manifest = createManifest({
      kind: 'resource',
      path: './contributions/palette.json',
      integrity: 'sha256-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
    });
    const loaded = await loadAndValidateContributionDescriptors(
      createLoadContext(
        manifest,
        new TextEncoder().encode('{"label":"Button"}')
      )
    );
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;

    const prepared = await prepareValidatedContributions({
      owner,
      manifest,
      permission: createPermission(manifest),
      descriptors: loaded.value,
      operationId: 'operation-1',
      signal: new AbortController().signal,
    });

    expect(prepared.ok).toBe(true);
    if (!prepared.ok) return;
    expect(prepared.value[0]?.prepared.value).toEqual({ label: 'Button' });
    expect(prepared.value[0]?.prepared.dependsOnCapabilities).toEqual([
      { id: 'extension.register', scope: 'paletteContribution' },
    ]);
  });

  it('rejects duplicate resource keys before contract validation', async () => {
    const manifest = createManifest({
      kind: 'resource',
      path: './contributions/palette.json',
    });
    const result = await loadAndValidateContributionDescriptors(
      createLoadContext(
        manifest,
        new TextEncoder().encode('{"label":"A","label":"B"}')
      )
    );

    expect(result.ok).toBe(false);
    expect(result.diagnostics[0].code).toBe('PLG-1011');
  });

  it('rejects an integrity mismatch', async () => {
    const manifest = createManifest({
      kind: 'resource',
      path: './contributions/palette.json',
      integrity: 'sha256-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
    });
    const result = await loadAndValidateContributionDescriptors(
      createLoadContext(
        manifest,
        new TextEncoder().encode('{"label":"Button"}'),
        { integrityMatches: false }
      )
    );

    expect(result.ok).toBe(false);
    expect(result.diagnostics[0].code).toBe('PLG-1012');
  });

  it('does not read or prepare a denied optional point', async () => {
    const manifest = createManifest({
      kind: 'resource',
      path: './contributions/palette.json',
    });
    manifest.capabilities[0] = {
      ...manifest.capabilities[0]!,
      optional: true,
    };
    let readCount = 0;
    const context = createLoadContext(manifest, new Uint8Array(), {
      granted: false,
    });
    context.reader.readResource = async () => {
      readCount += 1;
      return pluginHostSuccess(new Uint8Array());
    };

    const result = await loadAndValidateContributionDescriptors(context);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toEqual([]);
    expect(readCount).toBe(0);
  });

  it('rejects duplicate Host contract identities', () => {
    const result = createContributionContractRegistry([contract, contract]);

    expect(result.ok).toBe(false);
    expect(result.diagnostics[0].code).toBe('PLG-3014');
  });
});
