import type { StorybookConfig } from '@storybook/react-vite';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { mergeConfig, type UserConfig } from 'vite';

const storybookDir = dirname(fileURLToPath(import.meta.url));

function shouldIgnoreRollupWarning(warning: {
  code?: string;
  message?: string;
}) {
  return (
    warning.code === 'MODULE_LEVEL_DIRECTIVE' &&
    warning.message?.includes('"use client"') &&
    warning.message.includes('react-router')
  );
}

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: [
    '@storybook/addon-docs',
    '@storybook/addon-links',
    '@storybook/addon-a11y',
    '@storybook/addon-vitest',
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  viteFinal: async (baseConfig) =>
    mergeConfig(baseConfig, {
      resolve: {
        alias: {
          '@prodivix/shared': resolve(storybookDir, '../../shared/src'),
          '@prodivix/themes': resolve(storybookDir, '../../themes/src'),
        },
      },
      build: {
        rollupOptions: {
          onwarn(warning, warn) {
            if (shouldIgnoreRollupWarning(warning)) {
              return;
            }

            warn(warning);
          },
        },
      },
    } satisfies UserConfig),
};

export default config;
