import { copyFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CONTRACT_CATALOG } from './contractCatalog.mjs';

const packageRoot = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const repositoryRoot = path.resolve(packageRoot, '../..');
const outputDirectory = path.join(packageRoot, 'dist/schema');

await mkdir(outputDirectory, { recursive: true });

await Promise.all(
  CONTRACT_CATALOG.map(({ schemaFile }) =>
    copyFile(
      path.join(repositoryRoot, 'specs/plugins', schemaFile),
      path.join(outputDirectory, schemaFile)
    )
  )
);

console.log('Plugin contract schemas copied to dist/schema.');
