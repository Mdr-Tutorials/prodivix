import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const appRoot = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const broker = await readFile(
  path.join(appRoot, 'src/runtimeBroker.ts'),
  'utf8'
);
const ui = await readFile(path.join(appRoot, 'src/uiConformance.ts'), 'utf8');

if (!broker.includes('prodivix-runtime-bootstrap-ready')) {
  throw new Error('Runtime broker bootstrap contract is missing.');
}
if (!broker.includes('workerBootstrapDigest')) {
  throw new Error('Runtime broker must verify Worker bootstrap integrity.');
}
if (!ui.includes('parentDomBlocked') || !ui.includes('networkBlocked')) {
  throw new Error('UI sandbox conformance coverage is incomplete.');
}

console.log('Plugin sandbox source policy checks passed.');
