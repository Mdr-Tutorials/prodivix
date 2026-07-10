import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { compile } from 'json-schema-to-typescript';
import { format, resolveConfig } from 'prettier';

const packageRoot = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const repositoryRoot = path.resolve(packageRoot, '../..');
const checkOnly = process.argv.includes('--check');

const contracts = [
  {
    schemaFile: 'plugin-manifest-v1.schema.json',
    rootType: 'PluginManifestV1',
    typesFile: 'pluginManifest.generated.ts',
    schemaModuleFile: 'pluginManifestSchema.generated.ts',
    schemaConstant: 'PLUGIN_MANIFEST_V1_SCHEMA',
  },
  {
    schemaFile: 'palette-contribution-v1.schema.json',
    rootType: 'PaletteContributionV1',
    typesFile: 'paletteContribution.generated.ts',
    schemaModuleFile: 'paletteContributionSchema.generated.ts',
    schemaConstant: 'PALETTE_CONTRIBUTION_V1_SCHEMA',
  },
];

const outputs = [];

for (const contract of contracts) {
  const schemaPath = path.join(
    repositoryRoot,
    'specs/plugins',
    contract.schemaFile
  );
  const prettierConfig = (await resolveConfig(schemaPath)) ?? {};
  const sourceLabel = path
    .relative(repositoryRoot, schemaPath)
    .replaceAll(path.sep, '/');
  const generatedNotice = `/**
 * Generated from ${sourceLabel}.
 * DO NOT EDIT. Run \`pnpm --filter @prodivix/plugin-contracts generate\`.
 */`;
  const schema = JSON.parse(await readFile(schemaPath, 'utf8'));
  const schemaVersion = schema.properties?.schemaVersion?.const;

  if (typeof schemaVersion !== 'string' || schemaVersion.length === 0) {
    throw new Error(
      `${contract.schemaFile} must define properties.schemaVersion.const.`
    );
  }

  const generatedTypes = await compile(schema, contract.rootType, {
    bannerComment: `/* eslint-disable */\n${generatedNotice}`,
    format: false,
    ignoreMinAndMaxItems: true,
    style: {
      singleQuote: true,
      semi: true,
      tabWidth: 2,
    },
  });
  const generatedSchemaModule = `${generatedNotice}

export const ${contract.schemaConstant}_ID = ${JSON.stringify(schema.$id)};
export const ${contract.schemaConstant}_VERSION = ${JSON.stringify(schemaVersion)};
export const ${contract.schemaConstant}: object = ${JSON.stringify(schema)};
`;

  outputs.push(
    {
      path: path.join(packageRoot, 'src/generated', contract.typesFile),
      content: await format(generatedTypes, {
        ...prettierConfig,
        parser: 'typescript',
      }),
    },
    {
      path: path.join(packageRoot, 'src/generated', contract.schemaModuleFile),
      content: await format(generatedSchemaModule, {
        ...prettierConfig,
        parser: 'typescript',
      }),
    }
  );
}

for (const output of outputs) {
  if (checkOnly) {
    const current = await readFile(output.path, 'utf8').catch(() => undefined);
    if (current !== output.content) {
      throw new Error(
        `${path.relative(repositoryRoot, output.path)} is stale. Run the generate script.`
      );
    }
    continue;
  }

  await writeFile(output.path, output.content, 'utf8');
}

console.log(
  checkOnly
    ? 'Plugin contract generated files are current.'
    : 'Plugin contract generated files updated.'
);
