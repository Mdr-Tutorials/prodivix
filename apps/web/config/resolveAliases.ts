import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { AliasOptions } from 'vite';

const configDir = fileURLToPath(new URL('.', import.meta.url));
const webRoot = resolve(configDir, '..');
const repoRoot = resolve(webRoot, '../..');

const packageSource = (packageName: string) =>
  resolve(repoRoot, `packages/${packageName}/src`);

const packageManifest = (packageName: string) =>
  resolve(repoRoot, `packages/${packageName}/package.json`);

export const createWebResolveAliases = (): AliasOptions => ({
  '@': resolve(webRoot, 'src'),
  '#src': packageSource('prodivix-compiler'),
  '@prodivix/ai': packageSource('ai'),
  '@prodivix/i18n': packageSource('i18n'),
  '@prodivix/plugin-browser': packageSource('plugin-browser'),
  '@prodivix/plugin-contracts': packageSource('plugin-contracts'),
  '@prodivix/plugin-host': packageSource('plugin-host'),
  '@prodivix/plugin-protocol': packageSource('plugin-protocol'),
  '@prodivix/prodivix-compiler': packageSource('prodivix-compiler'),
  '@prodivix/shared/safety': resolve(packageSource('shared'), 'safety'),
  '@prodivix/shared/package.json': packageManifest('shared'),
  '@prodivix/shared': packageSource('shared'),
  '@prodivix/ui/package.json': packageManifest('ui'),
  '@prodivix/ui': packageSource('ui'),
  '@prodivix/themes/package.json': packageManifest('themes'),
  '@prodivix/themes': packageSource('themes'),
  '#contracts': packageSource('plugin-contracts'),
  '#browser': packageSource('plugin-browser'),
  '#host': packageSource('plugin-host'),
  '#protocol': packageSource('plugin-protocol'),
});
