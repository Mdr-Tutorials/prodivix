import { copyFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const packageRoot = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const repositoryRoot = path.resolve(packageRoot, '../..');
const schemaRoot = path.join(repositoryRoot, 'specs/plugins/runtime');
const outputRoot = path.join(packageRoot, 'dist/schema');
const schemas = [
  'runtime-envelope-v1.schema.json',
  'runtime-control-v1.schema.json',
  'runtime-implementation-v1.schema.json',
  'gateway-envelope-v1.schema.json',
];

await mkdir(outputRoot, { recursive: true });
await Promise.all(
  schemas.map((schema) =>
    copyFile(path.join(schemaRoot, schema), path.join(outputRoot, schema))
  )
);

console.log('Plugin protocol schemas copied to dist/schema.');
