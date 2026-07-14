import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { format, resolveConfig } from 'prettier';
import { nodeGraphCurrentWireSchema } from '../packages/nodegraph/src/wire.ts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const target = path.join(
  root,
  'apps/backend/internal/platform/nodegraphcontract/current_schema.generated.json'
);
const prettierConfig = (await resolveConfig(target)) ?? {};
const expected = await format(JSON.stringify(nodeGraphCurrentWireSchema), {
  ...prettierConfig,
  filepath: target,
});
const mode = process.argv[2] ?? 'check';

if (mode === 'sync') {
  await writeFile(target, expected, 'utf8');
  process.stdout.write('Synchronized the NodeGraph current wire contract.\n');
} else if (mode === 'check') {
  const actual = await readFile(target, 'utf8').catch(() => '');
  if (actual !== expected) {
    process.stderr.write(
      'NodeGraph backend wire schema is stale. Run pnpm nodegraph:sync-wire.\n'
    );
    process.exitCode = 1;
  }
} else {
  throw new Error(`Unknown mode: ${mode}`);
}
