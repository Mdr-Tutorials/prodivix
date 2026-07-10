import { copyFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const packageRoot = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const repositoryRoot = path.resolve(packageRoot, '../..');
const outputDirectory = path.join(packageRoot, 'dist/schema');

await mkdir(outputDirectory, { recursive: true });
await Promise.all(
  ['plugin-manifest-v1.schema.json', 'palette-contribution-v1.schema.json'].map(
    (fileName) =>
      copyFile(
        path.join(repositoryRoot, 'specs/plugins', fileName),
        path.join(outputDirectory, fileName)
      )
  )
);

console.log('Plugin contract schemas copied to dist/schema.');
