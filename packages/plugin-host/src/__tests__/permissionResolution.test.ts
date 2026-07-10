import { describe, expect, it } from 'vitest';
import type {
  CapabilityRequest,
  PluginManifestV1,
} from '@prodivix/plugin-contracts';
import { normalizePolicySnapshot } from '#host/capability/capabilityPolicy';
import { resolvePermissionSnapshot } from '#host/capability/permissionResolution';
import { createPluginOwnerRef } from '#host/identity';

const owner = createPluginOwnerRef(
  '@prodivix/plugin-permission-test',
  'installation-1',
  1
);

const requests: readonly CapabilityRequest[] = [
  {
    id: 'workspace.read',
    reason: 'Read the current workspace.',
  },
  {
    id: 'document.read',
    scope: 'src/**',
    reason: 'Read source documents.',
    optional: true,
  },
];

const manifest: PluginManifestV1 = {
  schemaVersion: '1.0',
  id: owner.pluginId,
  displayName: 'Permission test plugin',
  version: '1.0.0',
  publisher: 'prodivix',
  engines: { prodivix: '>=0.1.0 <1.0.0' },
  capabilities: [...requests],
  contributes: [
    {
      id: 'test.palette',
      point: 'paletteContribution',
      contractVersion: '1.0',
      source: { kind: 'inline', descriptor: { kind: 'test' } },
    },
  ],
};

describe('permission resolution', () => {
  it('applies deny-wins and defaults undecided requests to denied', () => {
    const result = resolvePermissionSnapshot({
      owner,
      pluginVersion: manifest.version,
      requests,
      permissionRevision: 1,
      policyRevision: 'policy-1',
      policySource: 'test',
      decisions: [
        {
          capability: { id: 'workspace.read' },
          decision: 'grant',
          source: 'user',
          reasonCode: 'user-approved',
        },
        {
          capability: { id: 'workspace.read' },
          decision: 'deny',
          source: 'administrator',
          reasonCode: 'admin-policy',
        },
      ],
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value.decisions).toEqual([
      expect.objectContaining({
        capability: { id: 'document.read', scope: 'src/**' },
        decision: 'deny',
        optional: true,
        reasonCode: 'not-granted',
      }),
      expect.objectContaining({
        capability: { id: 'workspace.read' },
        decision: 'deny',
        optional: false,
        reasonCode: 'admin-policy',
      }),
    ]);
    expect(result.value.deniedRequired).toEqual([{ id: 'workspace.read' }]);
    expect(result.value.deniedOptional).toEqual([
      { id: 'document.read', scope: 'src/**' },
    ]);
    expect(Object.isFrozen(result.value)).toBe(true);
    expect(Object.isFrozen(result.value.decisions)).toBe(true);
  });

  it('rejects decisions for an unrequested scope', () => {
    const result = resolvePermissionSnapshot({
      owner,
      pluginVersion: manifest.version,
      requests,
      permissionRevision: 1,
      policyRevision: 'policy-1',
      policySource: 'test',
      decisions: [
        {
          capability: { id: 'document.read', scope: 'assets/**' },
          decision: 'grant',
          source: 'user',
          reasonCode: 'user-approved',
        },
      ],
    });

    expect(result.ok).toBe(false);
    expect(result.diagnostics[0].code).toBe('PLG-3002');
  });

  it('normalizes a complete snapshot and reports required denial', () => {
    const resolved = resolvePermissionSnapshot({
      owner,
      pluginVersion: manifest.version,
      requests,
      permissionRevision: 3,
      policyRevision: 'policy-3',
      policySource: 'test',
      decisions: [
        {
          capability: { id: 'workspace.read' },
          decision: 'deny',
          source: 'host-safety',
          reasonCode: 'workspace-locked',
        },
        {
          capability: { id: 'document.read', scope: 'src/**' },
          decision: 'grant',
          source: 'administrator',
          reasonCode: 'admin-approved',
        },
      ],
    });
    expect(resolved.ok).toBe(true);
    if (!resolved.ok) return;

    const normalized = normalizePolicySnapshot(
      {
        owner,
        manifest,
        attestation: {
          sourceId: 'test-source',
          packageDigest: 'sha256-test',
          trustLevel: 'development',
          publisherVerified: false,
        },
        nextPermissionRevision: 3,
      },
      resolved.value
    );

    expect(normalized.ok).toBe(true);
    expect(normalized.diagnostics.map((diagnostic) => diagnostic.code)).toEqual(
      ['PLG-3001']
    );
  });

  it('rejects a stale policy revision', () => {
    const resolved = resolvePermissionSnapshot({
      owner,
      pluginVersion: manifest.version,
      requests,
      permissionRevision: 1,
      policyRevision: 'policy-1',
      policySource: 'test',
      decisions: [],
    });
    expect(resolved.ok).toBe(true);
    if (!resolved.ok) return;

    const normalized = normalizePolicySnapshot(
      {
        owner,
        manifest,
        attestation: {
          sourceId: 'test-source',
          packageDigest: 'sha256-test',
          trustLevel: 'development',
          publisherVerified: false,
        },
        nextPermissionRevision: 2,
      },
      resolved.value
    );

    expect(normalized.ok).toBe(false);
    expect(normalized.diagnostics[0].code).toBe('PLG-3002');
  });
});
