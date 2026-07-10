import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '#contracts': resolve(__dirname, 'src'),
    },
  },
  test: {
    environment: 'node',
  },
});
