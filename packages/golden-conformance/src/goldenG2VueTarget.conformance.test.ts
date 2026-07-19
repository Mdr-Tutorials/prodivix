import { describe, expect, it } from 'vitest';
import {
  decodeRemoteExecutableProjectSnapshot,
  encodeRemoteExecutableProjectSnapshot,
} from '@prodivix/runtime-remote';
import {
  createGoldenG2VueExecutableSnapshot,
  createGoldenG2VueProjectedBundle,
} from './goldenG2VueTargetFixture';

describe('Golden G2 Vue/Vite target contract', () => {
  it('preserves the second target and CRUD fixture through executable and Remote codecs', () => {
    const snapshot = createGoldenG2VueExecutableSnapshot();
    expect(snapshot.target).toEqual({
      presetId: 'vue-vite',
      framework: 'vue',
      runtime: 'vite',
    });
    expect(snapshot.entrypoints).toContainEqual({
      kind: 'test',
      path: 'src/App.test.ts',
    });
    expect(snapshot.dataMockProvision?.fixtures).toHaveLength(7);
    expect(snapshot.capabilityRequirements.preview).not.toContain('network');

    const decoded = decodeRemoteExecutableProjectSnapshot(
      encodeRemoteExecutableProjectSnapshot(snapshot)
    );
    expect(decoded.target).toEqual(snapshot.target);
    expect(decoded.contentDigest).toBe(snapshot.contentDigest);
    expect(decoded.dataMockProvision).toEqual(snapshot.dataMockProvision);

    const bundle = createGoldenG2VueProjectedBundle();
    expect(
      bundle.files.find(
        ({ path }) => path === 'public/.prodivix/data-runtime.json'
      )?.contents
    ).toContain('"mode":"mock"');
    expect(
      bundle.files.find(
        ({ path }) => path === 'public/.prodivix/data-mock-provision.json'
      )?.contents
    ).toContain('golden-g2-vue-crud');
    expect(
      bundle.files.find(({ path }) => path === 'src/App.test.ts')?.contents
    ).toContain('data-products:delete-product');
  });
});
