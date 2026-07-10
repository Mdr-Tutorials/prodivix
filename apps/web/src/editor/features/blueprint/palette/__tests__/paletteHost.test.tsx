import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ComponentGroup } from '@/editor/features/blueprint/editor/model/types';
import {
  createPaletteContributionDescriptor,
  disableTrustedPalettePlugin,
  getPaletteItemById,
  getPaletteRegistrySnapshot,
  registerTrustedPaletteContribution,
} from '@/editor/features/blueprint/palette';
import { ensureNativePaletteContribution } from '@/editor/features/blueprint/palette/nativeContribution';

const registeredPluginIds = new Set<string>();

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

const registerGroup = async (
  pluginId: string,
  group: ComponentGroup,
  version = '1.0.0'
) => {
  registeredPluginIds.add(pluginId);
  return registerTrustedPaletteContribution({
    pluginId,
    displayName: `${group.title} Test`,
    version,
    installationId: `test:${pluginId}`,
    contributionId: 'test.palette',
    descriptor: createPaletteContributionDescriptor([group]),
    groups: [group],
    order: 500,
  });
};

afterEach(async () => {
  for (const pluginId of registeredPluginIds) {
    await disableTrustedPalettePlugin(pluginId);
  }
  registeredPluginIds.clear();
});

describe('Blueprint Palette Host', () => {
  it('publishes the native catalog through the Host registry', async () => {
    const result = await ensureNativePaletteContribution();
    expect(result).toEqual(expect.objectContaining({ ok: true }));
    await vi.waitFor(() => {
      expect(getPaletteItemById('button')?.name).toBe('Button');
      expect(getPaletteItemById('radix-dialog')?.name).toBe('Dialog');
    });
  });

  it('publishes and removes a trusted resolved contribution', async () => {
    const pluginId = '@prodivix/test.palette.publish';
    const group = createGroup(
      'test-publish-group',
      'test-publish-item',
      'Published'
    );

    const registered = await registerGroup(pluginId, group);

    expect(registered.ok).toBe(true);
    expect(getPaletteItemById('test-publish-item')?.name).toBe('Published');
    expect(
      getPaletteRegistrySnapshot().groups.some(
        (candidate) => candidate.id === 'test-publish-group'
      )
    ).toBe(true);

    const disabled = await disableTrustedPalettePlugin(pluginId);

    expect(disabled.ok).toBe(true);
    expect(getPaletteItemById('test-publish-item')).toBeUndefined();
  });

  it('atomically replaces a contribution from the same owner identity', async () => {
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

    const firstResult = await registerGroup(pluginId, first, '1.0.0');
    const secondResult = await registerGroup(pluginId, second, '1.1.0');

    expect(firstResult.ok).toBe(true);
    expect(secondResult.ok).toBe(true);
    expect(secondResult.ok && secondResult.value.generation).toBe(2);
    expect(getPaletteItemById('test-replace-item')?.name).toBe('Second');
    expect(
      getPaletteRegistrySnapshot().groups.filter(
        (candidate) => candidate.id === 'test-replace-group'
      )
    ).toHaveLength(1);
  });

  it('rejects cross-owner palette ids without overwriting the first owner', async () => {
    const firstPluginId = '@prodivix/test.palette.owner-a';
    const secondPluginId = '@prodivix/test.palette.owner-b';
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

    const firstResult = await registerGroup(firstPluginId, first);
    const secondResult = await registerGroup(secondPluginId, second);

    expect(firstResult.ok).toBe(true);
    expect(secondResult.ok).toBe(false);
    expect(secondResult.diagnostics.map((item) => item.code)).toContain(
      'PLG-3010'
    );
    expect(getPaletteItemById('test-conflict-item')?.name).toBe('Owner A');
  });

  it('rejects non-JSON default props before Host discovery', async () => {
    const pluginId = '@prodivix/test.palette.invalid';
    const group = createGroup(
      'test-invalid-group',
      'test-invalid-item',
      'Invalid'
    );
    group.items[0]!.defaultProps = {
      onClick: () => undefined,
    };

    const result = await registerGroup(pluginId, group);

    expect(result.ok).toBe(false);
    expect(result.diagnostics[0]?.code).toBe('PLG-1003');
    expect(getPaletteItemById('test-invalid-item')).toBeUndefined();
  });
});
