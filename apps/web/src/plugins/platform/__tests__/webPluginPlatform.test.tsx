import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createPluginDiagnostic,
  PLUGIN_DIAGNOSTIC_CODES,
  type JsonValue,
} from '@prodivix/plugin-contracts';
import {
  defineContributionContract,
  pluginHostFailure,
  pluginHostSuccess,
} from '@prodivix/plugin-host';
import type { ComponentGroup } from '@/editor/features/blueprint/editor/model/types';
import { createPaletteContributionDescriptor } from '@/editor/features/blueprint/palette';
import {
  createWebPluginPlatform,
  installNativeCorePlugin,
  type TrustedWebPluginInput,
  type WebContributionPointMap,
  type WebPluginPlatform,
} from '@/plugins/platform';

const platforms = new Set<WebPluginPlatform>();

const createDeferred = () => {
  let resolve!: (value: void | PromiseLike<void>) => void;
  const promise = new Promise<void>((currentResolve) => {
    resolve = currentResolve;
  });
  return Object.freeze({ promise, resolve });
};

type TestRenderPolicyDescriptor = Readonly<{
  label: string;
  fail?: boolean;
}>;

type RenderPolicyContractControl = Readonly<{
  beforePrepare?: (
    descriptor: TestRenderPolicyDescriptor,
    signal: AbortSignal
  ) => Promise<void>;
}>;

const createRenderPolicyContract = (
  control: RenderPolicyContractControl = {}
) =>
  defineContributionContract<
    WebContributionPointMap,
    'renderPolicy',
    TestRenderPolicyDescriptor
  >({
    point: 'renderPolicy',
    contractVersion: '1.0',
    validateDescriptor: (input) => {
      if (
        typeof input === 'object' &&
        input !== null &&
        !Array.isArray(input) &&
        typeof input.label === 'string' &&
        (input.fail === undefined || typeof input.fail === 'boolean') &&
        Object.keys(input).every((key) => key === 'label' || key === 'fail')
      ) {
        return pluginHostSuccess(
          Object.freeze({
            label: input.label,
            ...(input.fail === undefined ? {} : { fail: input.fail }),
          })
        );
      }
      return pluginHostFailure([
        createPluginDiagnostic(
          PLUGIN_DIAGNOSTIC_CODES.CONTRIBUTION_SCHEMA_VIOLATION,
          'Test Render Policy requires a closed descriptor with a label.',
          { contributionPoint: 'renderPolicy', contractVersion: '1.0' }
        ),
      ]);
    },
    prepare: async ({ descriptor, signal }) => {
      await control.beforePrepare?.(descriptor, signal);
      if (descriptor.fail) {
        return pluginHostFailure([
          createPluginDiagnostic(
            PLUGIN_DIAGNOSTIC_CODES.CONTRIBUTION_RESOLVER_FAILED,
            'Test Render Policy preparation failed.',
            { contributionPoint: 'renderPolicy', contractVersion: '1.0' }
          ),
        ]);
      }
      return pluginHostSuccess({
        value: Object.freeze({}) as WebContributionPointMap['renderPolicy'],
        lifetime: 'installation',
        dependsOnCapabilities: [],
      });
    },
  });

const createPlatform = (
  contracts: Parameters<typeof createWebPluginPlatform>[0]['contracts'] = []
) => {
  const result = createWebPluginPlatform({
    workspaceId: `web-platform-test-${platforms.size + 1}`,
    contracts,
    integrityService: {
      digestSha256: async () =>
        'sha256-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
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

const createMultiPointPlugin = (input: {
  pluginId: string;
  version: string;
  group: ComponentGroup;
  policy: TestRenderPolicyDescriptor;
  policyFirst?: boolean;
}): TrustedWebPluginInput => {
  const paletteContribution = Object.freeze({
    id: 'test.palette',
    point: 'paletteContribution' as const,
    contractVersion: '1.0',
    descriptor: createPaletteContributionDescriptor([
      input.group,
    ]) as unknown as Readonly<Record<string, JsonValue>>,
    paletteProjection: Object.freeze({ groups: [input.group] }),
  });
  const renderPolicyContribution = Object.freeze({
    id: 'test.render-policy',
    point: 'renderPolicy' as const,
    contractVersion: '1.0',
    descriptor: input.policy,
  });
  const contributions = input.policyFirst
    ? [renderPolicyContribution, paletteContribution]
    : [paletteContribution, renderPolicyContribution];

  return Object.freeze({
    pluginId: input.pluginId,
    displayName: 'Multi-point test plugin',
    version: input.version,
    publisher: 'prodivix',
    installationId: `test:${input.pluginId}`,
    trustLevel: 'core',
    publisherVerified: true,
    contributions,
  });
};

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
    const platform = createPlatform([createRenderPolicyContract()]);
    const committedBatches: string[][] = [];
    const subscription = platform.runtime.packages.contributions.subscribe(
      (event) => {
        committedBatches.push(event.added.map((record) => record.point));
      }
    );
    const group = createGroup(
      'test-multi-point-group',
      'test-multi-point-item',
      'Multi-point'
    );

    const result = await platform.runtime.packages.install(
      createMultiPointPlugin({
        pluginId: '@prodivix/test.multi-point',
        version: '1.0.0',
        group,
        policy: { label: 'Test policy' },
      })
    );

    subscription.dispose();
    expect(result.ok).toBe(true);
    expect(committedBatches).toEqual([['paletteContribution', 'renderPolicy']]);
    expect(
      platform.runtime.packages.contributions.list('renderPolicy')
    ).toHaveLength(1);
    expect(
      platform.queries.palette.getItemById('test-multi-point-item')?.name
    ).toBe('Multi-point');
    const owners = [
      ...platform.runtime.packages.contributions.list('paletteContribution'),
      ...platform.runtime.packages.contributions.list('renderPolicy'),
    ].map((record) => record.owner);
    expect(new Set(owners.map((owner) => owner.generation))).toEqual(
      new Set([1])
    );
    expect(new Set(owners.map((owner) => owner.installationId))).toEqual(
      new Set(['test:@prodivix/test.multi-point'])
    );
  });

  it('rolls back every point and releases Palette claims when one resolver fails', async () => {
    const platform = createPlatform([createRenderPolicyContract()]);
    const group = createGroup(
      'test-rollback-group',
      'test-rollback-item',
      'Rollback'
    );

    const failed = await platform.runtime.packages.install(
      createMultiPointPlugin({
        pluginId: '@prodivix/test.multi-point-failure',
        version: '1.0.0',
        group,
        policy: { label: 'Failing policy', fail: true },
      })
    );

    expect(failed.ok).toBe(false);
    expect(
      platform.runtime.packages.contributions.list('paletteContribution')
    ).toEqual([]);
    expect(
      platform.runtime.packages.contributions.list('renderPolicy')
    ).toEqual([]);
    expect(platform.runtime.packages.contributions.getRevision()).toBe(0);
    expect(
      platform.queries.palette.getItemById('test-rollback-item')
    ).toBeUndefined();

    const retry = await registerGroup(
      platform,
      '@prodivix/test.palette-after-rollback',
      group
    );
    expect(retry.ok).toBe(true);
    expect(
      platform.queries.palette.getItemById('test-rollback-item')?.name
    ).toBe('Rollback');
  });

  it('keeps concurrent replacement projections bound to their package attestation', async () => {
    const firstPrepareStarted = createDeferred();
    const releaseFirstPrepare = createDeferred();
    let firstSignal: AbortSignal | undefined;
    const contract = createRenderPolicyContract({
      beforePrepare: async (descriptor, signal) => {
        if (descriptor.label !== 'First policy') return;
        firstSignal = signal;
        firstPrepareStarted.resolve(undefined);
        await releaseFirstPrepare.promise;
      },
    });
    const platform = createPlatform([contract]);
    const pluginId = '@prodivix/test.concurrent-replacement';
    const firstGroup = createGroup(
      'test-concurrent-first-group',
      'test-concurrent-first-item',
      'First projection'
    );
    const secondGroup = createGroup(
      'test-concurrent-second-group',
      'test-concurrent-second-item',
      'Second projection'
    );

    const firstInstall = platform.runtime.packages.install(
      createMultiPointPlugin({
        pluginId,
        version: '1.0.0',
        group: firstGroup,
        policy: { label: 'First policy' },
        policyFirst: true,
      })
    );
    await firstPrepareStarted.promise;

    const secondInstall = platform.runtime.packages.install(
      createMultiPointPlugin({
        pluginId,
        version: '1.1.0',
        group: secondGroup,
        policy: { label: 'Second policy' },
        policyFirst: true,
      })
    );
    await vi.waitFor(() => expect(firstSignal?.aborted).toBe(true));
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
    ).toBe('Second projection');
  });
});
