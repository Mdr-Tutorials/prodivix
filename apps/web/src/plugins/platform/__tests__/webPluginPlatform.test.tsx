import { afterEach, describe, expect, it } from 'vitest';
import { PLUGIN_DIAGNOSTIC_CODES } from '@prodivix/plugin-contracts';
import type { ComponentGroup } from '@/editor/features/blueprint/editor/model/types';
import { createPaletteContributionDescriptor } from '@/editor/features/blueprint/palette';
import {
  createWebPluginPlatform,
  installNativeCorePlugin,
  type OfficialHostModuleCatalogEntry,
  type WebPluginPlatform,
} from '@/plugins/platform';
import {
  createNeutralOfficialHostCatalog,
  createNeutralOfficialPlugin,
  NEUTRAL_OFFICIAL_HOST_MODULE,
  NEUTRAL_PACKAGE_DIGEST,
} from '@/plugins/platform/__tests__/neutralOfficialPlugin.fixture';

const platforms = new Set<WebPluginPlatform>();

const createDeferred = () => {
  let resolve!: (value: void | PromiseLike<void>) => void;
  const promise = new Promise<void>((currentResolve) => {
    resolve = currentResolve;
  });
  return Object.freeze({ promise, resolve });
};

const createPlatform = (
  officialHostModules: readonly OfficialHostModuleCatalogEntry[] = createNeutralOfficialHostCatalog()
) => {
  const result = createWebPluginPlatform({
    workspaceId: `web-platform-test-${platforms.size + 1}`,
    officialHostModules,
    integrityService: {
      digestSha256: async () => NEUTRAL_PACKAGE_DIGEST,
    },
  });
  if (result.ok === false) {
    throw new Error('Web Plugin Platform test instance must initialize.');
  }
  platforms.add(result.value);
  return result.value;
};

const createGroup = (
  groupId: string,
  itemId: string,
  label: string
): ComponentGroup => ({
  id: groupId,
  title: `${label} Group`,
  source: 'builtIn',
  items: [
    {
      id: itemId,
      name: label,
      runtimeType: 'TestComponent',
      preview: <span>{label}</span>,
      defaultProps: { label },
    },
  ],
});

const registerGroup = (
  platform: WebPluginPlatform,
  pluginId: string,
  group: ComponentGroup,
  version = '1.0.0'
) =>
  platform.runtime.paletteContributions.install({
    pluginId,
    displayName: `${group.title} Test`,
    version,
    installationId: `test:${pluginId}`,
    contributionId: 'test.palette',
    descriptor: createPaletteContributionDescriptor([group]),
    groups: [group],
    order: 500,
  });

afterEach(async () => {
  await Promise.all([...platforms].map((platform) => platform.shutdown()));
  platforms.clear();
});

describe('workspace Web Plugin Platform', () => {
  it('publishes the native catalog through the workspace Host', async () => {
    const platform = createPlatform();
    const result = await installNativeCorePlugin(
      platform.runtime.paletteContributions
    );

    expect(result.ok).toBe(true);
    expect(platform.queries.palette.getItemById('button')?.name).toBe('Button');
    expect(platform.queries.palette.getItemById('radix-dialog')?.name).toBe(
      'Dialog'
    );
  });

  it('publishes and removes a trusted resolved contribution', async () => {
    const platform = createPlatform();
    const pluginId = '@prodivix/test.palette.publish';
    const group = createGroup(
      'test-publish-group',
      'test-publish-item',
      'Published'
    );

    const registered = await registerGroup(platform, pluginId, group);

    expect(registered.ok).toBe(true);
    expect(
      platform.queries.palette.getItemById('test-publish-item')?.name
    ).toBe('Published');
    expect(
      platform.queries.palette
        .getSnapshot()
        .groups.some((candidate) => candidate.id === 'test-publish-group')
    ).toBe(true);

    const disabled =
      await platform.runtime.paletteContributions.disable(pluginId);

    expect(disabled.ok).toBe(true);
    expect(
      platform.queries.palette.getItemById('test-publish-item')
    ).toBeUndefined();
  });

  it('atomically replaces a contribution from the same owner identity', async () => {
    const platform = createPlatform();
    const pluginId = '@prodivix/test.palette.replace';
    const first = createGroup(
      'test-replace-group',
      'test-replace-item',
      'First'
    );
    const second = createGroup(
      'test-replace-group',
      'test-replace-item',
      'Second'
    );

    const firstResult = await registerGroup(platform, pluginId, first, '1.0.0');
    const secondResult = await registerGroup(
      platform,
      pluginId,
      second,
      '1.1.0'
    );

    expect(firstResult.ok).toBe(true);
    expect(secondResult.ok).toBe(true);
    expect(secondResult.ok && secondResult.value.generation).toBe(2);
    expect(
      platform.queries.palette.getItemById('test-replace-item')?.name
    ).toBe('Second');
    expect(
      platform.queries.palette
        .getSnapshot()
        .groups.filter((candidate) => candidate.id === 'test-replace-group')
    ).toHaveLength(1);
  });

  it('rejects cross-owner palette ids without overwriting the first owner', async () => {
    const platform = createPlatform();
    const first = createGroup(
      'test-conflict-group',
      'test-conflict-item',
      'Owner A'
    );
    const second = createGroup(
      'test-conflict-group',
      'test-conflict-item',
      'Owner B'
    );

    const firstResult = await registerGroup(
      platform,
      '@prodivix/test.palette.owner-a',
      first
    );
    const secondResult = await registerGroup(
      platform,
      '@prodivix/test.palette.owner-b',
      second
    );

    expect(firstResult.ok).toBe(true);
    expect(secondResult.ok).toBe(false);
    expect(secondResult.diagnostics.map((item) => item.code)).toContain(
      PLUGIN_DIAGNOSTIC_CODES.CONTRIBUTION_IDENTITY_CONFLICT
    );
    expect(
      platform.queries.palette.getItemById('test-conflict-item')?.name
    ).toBe('Owner A');
  });

  it('rejects non-JSON default props before Host discovery', async () => {
    const platform = createPlatform();
    const group = createGroup(
      'test-invalid-group',
      'test-invalid-item',
      'Invalid'
    );
    group.items[0]!.defaultProps = { onClick: () => undefined };

    const result = await registerGroup(
      platform,
      '@prodivix/test.palette.invalid',
      group
    );

    expect(result.ok).toBe(false);
    expect(result.diagnostics[0]?.code).toBe(
      PLUGIN_DIAGNOSTIC_CODES.NON_JSON_VALUE
    );
    expect(
      platform.queries.palette.getItemById('test-invalid-item')
    ).toBeUndefined();
  });

  it('publishes all contribution points in one registry transaction', async () => {
    const platform = createPlatform();
    const committedBatches: string[][] = [];
    const subscription = platform.runtime.packages.contributions.subscribe(
      (event) => {
        committedBatches.push(event.added.map((record) => record.point));
      }
    );
    const result = await platform.runtime.packages.install(
      createNeutralOfficialPlugin({
        label: 'Multi-point',
        groupId: 'test-multi-point-group',
        itemId: 'test-multi-point-item',
      })
    );

    subscription.dispose();
    expect(result.ok).toBe(true);
    expect(committedBatches).toEqual([
      [
        'externalLibrary',
        'paletteContribution',
        'renderPolicy',
        'codegenPolicy',
        'iconProvider',
      ],
    ]);
    expect(
      platform.runtime.packages.contributions.list('renderPolicy')
    ).toHaveLength(1);
    expect(
      platform.queries.palette.getItemById('test-multi-point-item')?.name
    ).toBe('Multi-point Button');
    const owners = [
      ...platform.runtime.packages.contributions.list('paletteContribution'),
      ...platform.runtime.packages.contributions.list('externalLibrary'),
      ...platform.runtime.packages.contributions.list('renderPolicy'),
      ...platform.runtime.packages.contributions.list('codegenPolicy'),
      ...platform.runtime.packages.contributions.list('iconProvider'),
    ].map((record) => record.owner);
    expect(new Set(owners.map((owner) => owner.generation))).toEqual(
      new Set([1])
    );
    expect(new Set(owners.map((owner) => owner.installationId))).toEqual(
      new Set(['fixture:@prodivix/plugin-neutral-fixture'])
    );
    expect(platform.queries.extensions.getSnapshot().revision).toBe(
      platform.queries.palette.getSnapshot().revision
    );
  });

  it('rolls back every point and releases Palette claims when one resolver fails', async () => {
    const platform = createPlatform();

    const failed = await platform.runtime.packages.install(
      createNeutralOfficialPlugin({
        label: 'Rollback',
        groupId: 'test-rollback-group',
        itemId: 'test-rollback-item',
        iconImplementationId: 'neutral.missing-icons',
      })
    );

    expect(failed.ok).toBe(false);
    expect(
      platform.runtime.packages.contributions.list('paletteContribution')
    ).toEqual([]);
    expect(
      platform.runtime.packages.contributions.list('renderPolicy')
    ).toEqual([]);
    expect(
      platform.runtime.packages.contributions.list('externalLibrary')
    ).toEqual([]);
    expect(
      platform.runtime.packages.contributions.list('codegenPolicy')
    ).toEqual([]);
    expect(
      platform.runtime.packages.contributions.list('iconProvider')
    ).toEqual([]);
    expect(platform.runtime.packages.contributions.getRevision()).toBe(0);
    expect(platform.listOfficialImplementationBindings()).toEqual([]);
    expect(
      platform.queries.palette.getItemById('test-rollback-item')
    ).toBeUndefined();

    const retry = await platform.runtime.packages.install(
      createNeutralOfficialPlugin({
        label: 'Rollback',
        groupId: 'test-rollback-group',
        itemId: 'test-rollback-item',
      })
    );
    expect(retry.ok).toBe(true);
    expect(
      platform.queries.palette.getItemById('test-rollback-item')?.name
    ).toBe('Rollback Button');
  });

  it('keeps concurrent replacement projections bound to their package attestation', async () => {
    const firstPrepareStarted = createDeferred();
    const releaseFirstPrepare = createDeferred();
    const platform = createPlatform(
      createNeutralOfficialHostCatalog(async () => {
        firstPrepareStarted.resolve(undefined);
        await releaseFirstPrepare.promise;
        return NEUTRAL_OFFICIAL_HOST_MODULE;
      })
    );

    const firstInstall = platform.runtime.packages.install(
      createNeutralOfficialPlugin({
        version: '1.0.0',
        label: 'First projection',
        groupId: 'test-concurrent-first-group',
        itemId: 'test-concurrent-first-item',
      })
    );
    await firstPrepareStarted.promise;

    const secondInstall = platform.runtime.packages.install(
      createNeutralOfficialPlugin({
        version: '1.1.0',
        label: 'Second projection',
        groupId: 'test-concurrent-second-group',
        itemId: 'test-concurrent-second-item',
      })
    );
    await new Promise((resolve) => setTimeout(resolve, 0));
    releaseFirstPrepare.resolve(undefined);

    const [firstResult, secondResult] = await Promise.all([
      firstInstall,
      secondInstall,
    ]);

    expect(firstResult.ok).toBe(false);
    expect(firstResult.diagnostics.map((item) => item.code)).toContain(
      PLUGIN_DIAGNOSTIC_CODES.OPERATION_SUPERSEDED
    );
    expect(firstResult.diagnostics.map((item) => item.code)).not.toContain(
      PLUGIN_DIAGNOSTIC_CODES.CONTRIBUTION_RESOLVER_FAILED
    );
    expect(secondResult.ok).toBe(true);
    expect(
      platform.queries.palette.getItemById('test-concurrent-first-item')
    ).toBeUndefined();
    expect(
      platform.queries.palette.getItemById('test-concurrent-second-item')?.name
    ).toBe('Second projection Button');
    expect(
      platform
        .listOfficialImplementationBindings()
        .every((binding) => binding.owner.generation === 2)
    ).toBe(true);
  });
});
