import { describe, expect, it } from 'vitest';
import { createPluginOwnerRef } from '@prodivix/plugin-host';
import { createOfficialHostImplementationRegistry } from '@/plugins/platform';
import {
  createNeutralOfficialHostCatalog,
  NEUTRAL_PACKAGE_DIGEST,
} from '@/plugins/platform/__tests__/neutralOfficialPlugin.fixture';

const owner = createPluginOwnerRef(
  '@prodivix/plugin-neutral-fixture',
  'fixture:@prodivix/plugin-neutral-fixture',
  1
);
const officialAttestation = Object.freeze({
  sourceId: 'fixture-source',
  packageDigest: NEUTRAL_PACKAGE_DIGEST,
  trustLevel: 'official' as const,
  publisherVerified: true,
});

const createRegistry = () => {
  const result = createOfficialHostImplementationRegistry(
    createNeutralOfficialHostCatalog()
  );
  if (result.ok === false) throw new Error('Fixture registry must initialize.');
  return result.value;
};

describe('OfficialHostImplementationRegistry', () => {
  it('binds exact package coordinates to an owner generation and releases leases', async () => {
    const registry = createRegistry();
    const first = await registry.bind({
      owner,
      attestation: officialAttestation,
      implementationId: 'neutral.components',
      expectedKind: 'component-library',
      expectedPackage: {
        name: '@neutral-ui/components',
        version: '1.2.3',
      },
      signal: new AbortController().signal,
    });
    const second = await registry.bind({
      owner,
      attestation: officialAttestation,
      implementationId: 'neutral.components',
      expectedKind: 'component-library',
      signal: new AbortController().signal,
    });

    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
    expect(registry.listBindings()).toEqual([
      expect.objectContaining({
        owner,
        implementationId: 'neutral.components',
        kind: 'component-library',
        leaseCount: 2,
      }),
    ]);
    if (first.ok) first.value.dispose();
    expect(registry.listBindings()[0]?.leaseCount).toBe(1);
    if (second.ok) second.value.dispose();
    expect(registry.listBindings()).toEqual([]);
  });

  it('denies community packages even when their digest matches a catalog entry', async () => {
    const result = await createRegistry().bind({
      owner,
      attestation: {
        ...officialAttestation,
        trustLevel: 'community',
      },
      implementationId: 'neutral.components',
      expectedKind: 'component-library',
      signal: new AbortController().signal,
    });

    expect(result.ok).toBe(false);
    expect(result.diagnostics[0]?.code).toBe('PLG-4050');
  });

  it('fails closed on implementation kind and package coordinate mismatches', async () => {
    const registry = createRegistry();
    const wrongKind = await registry.bind({
      owner,
      attestation: officialAttestation,
      implementationId: 'neutral.icons',
      expectedKind: 'component-library',
      signal: new AbortController().signal,
    });
    const wrongPackage = await registry.bind({
      owner,
      attestation: officialAttestation,
      implementationId: 'neutral.components',
      expectedKind: 'component-library',
      expectedPackage: {
        name: '@neutral-ui/components',
        version: '9.9.9',
      },
      signal: new AbortController().signal,
    });

    expect(wrongKind.ok).toBe(false);
    expect(wrongKind.diagnostics[0]?.code).toBe('PLG-4052');
    expect(wrongPackage.ok).toBe(false);
    expect(wrongPackage.diagnostics[0]?.code).toBe('PLG-4050');
    expect(registry.listBindings()).toEqual([]);
  });
});
