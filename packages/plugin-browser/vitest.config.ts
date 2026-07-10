import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '#browser': resolve(__dirname, 'src'),
      '@prodivix/plugin-contracts': resolve(
        __dirname,
        '../plugin-contracts/src'
      ),
      '@prodivix/plugin-host': resolve(__dirname, '../plugin-host/src'),
      '@prodivix/plugin-protocol': resolve(__dirname, '../plugin-protocol/src'),
      '#contracts': resolve(__dirname, '../plugin-contracts/src'),
      '#host': resolve(__dirname, '../plugin-host/src'),
      '#protocol': resolve(__dirname, '../plugin-protocol/src'),
    },
  },
  test: {
    environment: 'node',
  },
});
