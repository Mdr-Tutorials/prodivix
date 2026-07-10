import type { PluginManifestV1 } from '#contracts/index';

export const createValidManifest = (): PluginManifestV1 => ({
  $schema: 'https://prodivix.dev/schemas/plugin-manifest-v1.schema.json',
  schemaVersion: '1.0',
  id: '@prodivix/plugin-example',
  displayName: 'Example plugin',
  version: '1.2.3',
  publisher: 'prodivix',
  engines: {
    prodivix: '>=0.1.0 <1.0.0',
  },
  entrypoints: {
    runtime: {
      path: './dist/runtime.js',
    },
  },
  activationEvents: [
    {
      type: 'contribution.use',
      point: 'paletteContribution',
      contributionId: 'example.palette',
    },
  ],
  capabilities: [
    {
      id: 'extension.register',
      scope: 'paletteContribution',
      reason: 'Register the example palette contribution.',
    },
  ],
  contributes: [
    {
      id: 'example.palette',
      point: 'paletteContribution',
      contractVersion: '1.0',
      source: {
        kind: 'inline',
        descriptor: {
          componentIds: ['example.button'],
        },
      },
    },
  ],
});
