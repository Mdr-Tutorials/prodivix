import { describe, expect, it } from 'vitest';
import { resolvePermissionSnapshot } from '#host/capability/permissionResolution';
import { createContributionRegistry } from '#host/contribution/contributionRegistry';
import type { ContributionTransaction } from '#host/contribution/contributionTransaction';
import {
  createContributionIdentity,
  createPluginOwnerRef,
} from '#host/identity';

type TestContributionMap = {
  paletteContribution: Readonly<{ label: string }>;
};

const owner = createPluginOwnerRef(
  '@prodivix/plugin-registry-test',
  'installation-1',
  1
);

const permissionResult = resolvePermissionSnapshot({
  owner,
  pluginVersion: '1.0.0',
  requests: [
    {
      id: 'extension.register',
      scope: 'paletteContribution',
      reason: 'Register test palette items.',
    },
  ],
  decisions: [
    {
      capability: {
        id: 'extension.register',
        scope: 'paletteContribution',
      },
      decision: 'grant',
      source: 'administrator',
      reasonCode: 'test-grant',
    },
  ],
  permissionRevision: 1,
  policyRevision: 'policy-1',
  policySource: 'test',
});

if (!permissionResult.ok) throw new Error('Test permission must resolve.');
const permission = permissionResult.value;

const createHarness = () => {
  let currentOwner = owner;
  let currentPermission = permission;
  let currentOperationId = 'operation-1';
  const diagnostics: string[] = [];
  const registry = createContributionRegistry<TestContributionMap>(
    {
      getCurrentOwner: () => currentOwner,
      getPermissionSnapshot: () => currentPermission,
      isOperationCurrent: (_owner, operationId) =>
        operationId === currentOperationId,
    },
    (diagnostic) => diagnostics.push(diagnostic.code)
  );
  return {
    registry,
    diagnostics,
    setCurrentOwner: (value: typeof owner) => {
      currentOwner = value;
    },
    setCurrentPermission: (value: typeof permission) => {
      currentPermission = value;
    },
    setCurrentOperationId: (value: string) => {
      currentOperationId = value;
    },
  };
};

const stagePalette = (
  transaction: ContributionTransaction<TestContributionMap>,
  contributionId: string,
  options: {
    order?: number;
    ordinal?: number;
    dispose?: () => void | Promise<void>;
  } = {}
) =>
  transaction.stage({
    identity: createContributionIdentity(owner.pluginId, contributionId),
    owner,
    point: 'paletteContribution',
    contractVersion: '1.0',
    lifetime: 'installation',
    registrationOrdinal: options.ordinal ?? 0,
    order: options.order,
    requiredCapabilities: [
      { id: 'extension.register', scope: 'paletteContribution' },
    ],
    value: { label: contributionId },
    dispose: options.dispose,
  });

describe('contribution registry transactions', () => {
  it('publishes staged records atomically in deterministic order', async () => {
    const { registry } = createHarness();
    const events: number[] = [];
    registry.subscribe((event) => events.push(event.added.length));
    const transaction = registry.beginTransaction({
      owner,
      expectedRegistryRevision: 0,
      expectedPermissionRevision: 1,
      lifetime: 'installation',
      operationId: 'operation-1',
    });

    expect(stagePalette(transaction, 'later', { order: 10 }).ok).toBe(true);
    expect(stagePalette(transaction, 'first', { order: -1 }).ok).toBe(true);
    expect(registry.list('paletteContribution')).toEqual([]);

    const committed = await transaction.commit();

    expect(committed.ok).toBe(true);
    expect(events).toEqual([2]);
    expect(
      registry
        .list('paletteContribution')
        .map((record) => record.identity.contributionId)
    ).toEqual(['first', 'later']);
    expect(registry.getRevision()).toBe(1);
  });

  it('rolls back the entire stale transaction and disposes in reverse order', async () => {
    const { registry } = createHarness();
    const disposed: string[] = [];
    const first = registry.beginTransaction({
      owner,
      expectedRegistryRevision: 0,
      expectedPermissionRevision: 1,
      lifetime: 'installation',
      operationId: 'operation-1',
    });
    const stale = registry.beginTransaction({
      owner,
      expectedRegistryRevision: 0,
      expectedPermissionRevision: 1,
      lifetime: 'installation',
      operationId: 'operation-1',
    });
    stagePalette(first, 'committed');
    stagePalette(stale, 'stale-a', {
      dispose: () => {
        disposed.push('a');
      },
    });
    stagePalette(stale, 'stale-b', {
      dispose: () => {
        disposed.push('b');
      },
    });

    expect((await first.commit()).ok).toBe(true);
    const result = await stale.commit();

    expect(result.ok).toBe(false);
    expect(result.diagnostics[0].code).toBe('PLG-3011');
    expect(disposed).toEqual(['b', 'a']);
    expect(
      registry
        .list('paletteContribution')
        .map((record) => record.identity.contributionId)
    ).toEqual(['committed']);
    await stale.rollback();
    expect(disposed).toEqual(['b', 'a']);
  });

  it('isolates subscriber failures after commit', async () => {
    const { registry, diagnostics } = createHarness();
    registry.subscribe(() => {
      throw new Error('subscriber failed');
    });
    const transaction = registry.beginTransaction({
      owner,
      expectedRegistryRevision: 0,
      expectedPermissionRevision: 1,
      lifetime: 'installation',
      operationId: 'operation-1',
    });
    stagePalette(transaction, 'visible');

    const result = await transaction.commit();

    expect(result.ok).toBe(true);
    expect(result.diagnostics.map((diagnostic) => diagnostic.code)).toEqual([
      'PLG-4008',
    ]);
    expect(diagnostics).toEqual(['PLG-4008']);
    expect(registry.list('paletteContribution')).toHaveLength(1);
  });

  it('cleans only the selected owner lifetime and disposes exactly once', async () => {
    const { registry } = createHarness();
    let disposeCount = 0;
    const transaction = registry.beginTransaction({
      owner,
      expectedRegistryRevision: 0,
      expectedPermissionRevision: 1,
      lifetime: 'installation',
      operationId: 'operation-1',
    });
    stagePalette(transaction, 'owned', {
      dispose: () => {
        disposeCount += 1;
      },
    });
    await transaction.commit();

    await registry.disposeByOwner(owner, { operationId: 'cleanup-1' });
    await registry.disposeByOwner(owner, { operationId: 'cleanup-2' });

    expect(disposeCount).toBe(1);
    expect(registry.list('paletteContribution')).toEqual([]);
  });
});
