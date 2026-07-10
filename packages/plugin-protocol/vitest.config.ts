import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '#protocol': resolve(__dirname, 'src'),
      '@prodivix/plugin-contracts': resolve(
        __dirname,
        '../plugin-contracts/src'
      ),
    },
  },
  test: {
    environment: 'node',
  },
});
