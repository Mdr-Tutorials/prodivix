import { afterEach, describe, expect, it } from 'vitest';
import { getPaletteItemById } from '@/editor/features/blueprint/palette';
import {
  registerExternalGroups,
  unregisterExternalLibraryRuntime,
} from '@/editor/features/blueprint/external/runtime/registry';

const libraryId = 'test-external';

afterEach(async () => {
  await unregisterExternalLibraryRuntime(libraryId);
});

describe('external Palette registration', () => {
  it('publishes and removes external groups through the Host registry', async () => {
    const diagnostics = await registerExternalGroups(libraryId, '1.0.0', [
      {
        id: 'test-external-components',
        title: 'Test External',
        source: 'external',
        items: [
          {
            libraryId,
            componentName: 'Button',
            component: 'button',
            runtimeType: 'TestExternalButton',
            itemId: 'test-external-button',
            path: 'Button',
            adapter: { kind: 'custom' },
            preview: <button type="button">External</button>,
            defaultProps: { variant: 'primary' },
            propsSchema: {},
            slots: [],
            behaviorTags: [],
            codegenHints: {},
          },
        ],
      },
    ]);

    expect(diagnostics).toEqual([]);
    expect(getPaletteItemById('test-external-button')).toEqual(
      expect.objectContaining({
        libraryId,
        name: 'Button',
        runtimeType: 'TestExternalButton',
      })
    );

    await unregisterExternalLibraryRuntime(libraryId);

    expect(getPaletteItemById('test-external-button')).toBeUndefined();
  });
});
