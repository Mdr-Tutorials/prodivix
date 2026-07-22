import { describe, expect, it } from 'vitest';
import { createEmptyPirDocument } from '@prodivix/pir';
import type { PaletteQueryService } from '@/plugins/platform';
import { LAYOUT_PATTERN_GROUP } from '@/editor/features/blueprint/catalog/groups/LayoutPatternGroup';
import { instantiatePaletteItem } from './paletteCreation';

describe('Blueprint palette creation', () => {
  it('instantiates a native layout-pattern recipe as its complete PIR subtree', () => {
    const item = LAYOUT_PATTERN_GROUP.items.find(
      ({ id }) => id === 'layout-pattern-split'
    )!;
    const palette = {
      getItemById: (itemId: string) => (itemId === item.id ? item : undefined),
    } as PaletteQueryService;

    const fragment = instantiatePaletteItem(createEmptyPirDocument(), palette, {
      kind: 'native',
      owner: {
        pluginId: '@prodivix/core',
        installationId: 'core',
        generation: 1,
      },
      paletteContributionId: 'core.palette',
      itemId: item.id,
    });

    expect(Object.keys(fragment.nodesById)).toHaveLength(4);
    expect(fragment.nodesById[fragment.primaryNodeId]).toMatchObject({
      kind: 'element',
      type: 'PdxDiv',
      props: {
        dataAttributes: {
          kind: 'literal',
          value: expect.objectContaining({
            'data-layout-pattern': 'split',
          }),
        },
      },
    });
    expect(fragment.childIdsById[fragment.primaryNodeId]).toHaveLength(3);
    expect(
      Object.values(fragment.nodesById).some(
        (node) =>
          node.kind === 'element' && node.type === 'PdxLayoutPatternSplit'
      )
    ).toBe(false);
  });
});
