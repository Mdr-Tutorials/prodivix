import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { format, resolveConfig } from 'prettier';
import { build } from 'vite';

const packageRoot = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const repositoryRoot = path.resolve(packageRoot, '../..');
const checkOnly = process.argv.includes('--check');
const entry = path.join(packageRoot, 'scripts/runtime-worker.entry.ts');
const outputPath = path.join(
  packageRoot,
  'src/generated/runtimeWorkerBootstrap.generated.ts'
);

const packageSource = (name) =>
  path.join(repositoryRoot, 'packages', name, 'src');

const result = await build({
  configFile: false,
  logLevel: 'silent',
  resolve: {
    alias: {
      '@prodivix/plugin-contracts': packageSource('plugin-contracts'),
      '@prodivix/plugin-protocol': packageSource('plugin-protocol'),
      '#contracts': packageSource('plugin-contracts'),
      '#protocol': packageSource('plugin-protocol'),
    },
  },
  build: {
    write: false,
    target: 'es2022',
    minify: true,
    sourcemap: false,
    lib: {
      entry,
      formats: ['iife'],
      name: 'ProdivixRuntimeWorkerBootstrap',
      fileName: () => 'runtime-worker-bootstrap.js',
    },
    rollupOptions: {
      output: {
        codeSplitting: false,
      },
    },
  },
});

const outputs = Array.isArray(result) ? result : [result];
const chunk = outputs
  .flatMap((output) => output.output)
  .find((output) => output.type === 'chunk' && output.isEntry);
if (!chunk || chunk.type !== 'chunk') {
  throw new Error('Worker bootstrap build did not produce one entry chunk.');
}

const source = chunk.code;
const digest = `sha256-${createHash('sha256').update(source).digest('base64')}`;
const prettierConfig = (await resolveConfig(outputPath)) ?? {};
const generated = await format(
  `/**
 * Generated from packages/plugin-browser/scripts/runtime-worker.entry.ts.
 * DO NOT EDIT. Run \`pnpm --filter @prodivix/plugin-browser generate\`.
 */

export const RUNTIME_WORKER_BOOTSTRAP_SOURCE = ${JSON.stringify(source)};
export const RUNTIME_WORKER_BOOTSTRAP_DIGEST = ${JSON.stringify(digest)};
`,
  { ...prettierConfig, parser: 'typescript' }
);

if (checkOnly) {
  const current = await readFile(outputPath, 'utf8').catch(() => undefined);
  if (current !== generated) {
    throw new Error(
      `${path.relative(repositoryRoot, outputPath)} is stale. Run the generate script.`
    );
  }
} else {
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, generated, 'utf8');
}

console.log(
  checkOnly
    ? 'Browser runtime Worker bootstrap is current.'
    : 'Browser runtime Worker bootstrap generated.'
);
