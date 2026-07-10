import { afterEach, describe, expect, it } from 'vitest';
import {
  registerExternalGroups,
  unregisterExternalLibraryRuntime,
} from '@/editor/features/blueprint/external/runtime/registry';
import {
  createWebPluginPlatform,
  type WebPluginPlatform,
} from '@/plugins/platform';

const libraryId = 'test-external';
let platform: WebPluginPlatform | undefined;

const getPlatform = () => {
  const result = createWebPluginPlatform({
    workspaceId: 'external-registry-test',
    integrityService: {
      digestSha256: async () =>
        'sha256-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
    },
  });
  if (!result.ok) throw new Error('External registry platform must resolve.');
  platform = result.value;
  return platform;
};

afterEach(async () => {
  if (!platform) return;
  await unregisterExternalLibraryRuntime(
    platform.runtime.paletteContributions,
    libraryId
  );
  await platform.shutdown();
  platform = undefined;
});

describe('external Palette registration', () => {
  it('publishes and removes external groups through the Host registry', async () => {
    const current = getPlatform();
    const diagnostics = await registerExternalGroups(
      current.runtime.paletteContributions,
      libraryId,
      '1.0.0',
      [
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
      ]
    );

    expect(diagnostics).toEqual([]);
    expect(current.queries.palette.getItemById('test-external-button')).toEqual(
      expect.objectContaining({
        libraryId,
        name: 'Button',
        runtimeType: 'TestExternalButton',
      })
    );

    await unregisterExternalLibraryRuntime(
      current.runtime.paletteContributions,
      libraryId
    );

    expect(
      current.queries.palette.getItemById('test-external-button')
    ).toBeUndefined();
  });
});
