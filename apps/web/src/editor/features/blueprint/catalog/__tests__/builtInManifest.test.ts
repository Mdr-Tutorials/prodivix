import { describe, expect, it } from 'vitest';
import type { ComponentGroup } from '@/editor/features/blueprint/editor/model/types';
import { applyBuiltInManifest } from '@/editor/features/blueprint/catalog/builtInManifest';

const group: ComponentGroup = {
  id: 'test',
  title: 'Test',
  items: [
    { id: 'button', name: 'Button', preview: null },
    { id: 'modal', name: 'Modal', preview: null },
    { id: 'grid', name: 'Grid', preview: null },
  ],
};

describe('applyBuiltInManifest', () => {
  it('projects runtime types, defaults, and enum options into catalog items', () => {
    const result = applyBuiltInManifest(group);
    const button = result.items.find((item) => item.id === 'button');

    expect(button).toMatchObject({
      runtimeType: 'PdxButton',
      defaultProps: {
        disabled: false,
        loading: false,
        size: 'Medium',
        tone: 'Neutral',
        variant: 'Secondary',
      },
      propOptions: {
        size: ['ExtraSmall', 'Small', 'Medium', 'Large'],
        variant: ['Primary', 'Secondary', 'Ghost'],
      },
    });
  });

  it('omits hidden authoring props and resolves catalog aliases', () => {
    const result = applyBuiltInManifest(group);
    const modal = result.items.find((item) => item.id === 'modal');
    const grid = result.items.find((item) => item.id === 'grid');

    expect(modal?.runtimeType).toBe('PdxModal');
    expect(modal?.defaultProps).not.toHaveProperty('portal');
    expect(grid?.runtimeType).toBe('PdxDiv');
  });
});
