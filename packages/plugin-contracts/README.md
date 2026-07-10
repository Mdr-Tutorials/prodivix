# @prodivix/plugin-contracts

JSON-only contracts and validation for Prodivix plugins. This package has no React, DOM, editor, or application dependency.

## Source Of Truth

`specs/plugins/plugin-manifest-v1.schema.json` and `specs/plugins/palette-contribution-v1.schema.json` are the manually maintained contract schemas. Generated TypeScript types and runtime Schema modules are committed so consumers do not need a code generator at runtime.

```bash
pnpm --filter @prodivix/plugin-contracts generate
pnpm --filter @prodivix/plugin-contracts check:generated
```

## Public API

- `parsePluginManifest` parses size-limited, BOM-free UTF-8 strict JSON and preserves the exact source bytes.
- `validatePluginManifest` applies the recursive JSON value guard, JSON Schema, and cross-field semantic rules.
- `parseAndValidatePluginManifest` combines both stages for installation and discovery flows.
- `PLUGIN_DIAGNOSTIC_CODES` exposes stable `PLG-xxxx` codes.
- `PLUGIN_MANIFEST_V1_SCHEMA` exposes the runtime Schema object.
- `BUILT_IN_CONTRIBUTION_POINTS` exposes the current authoring catalog; well-formed future point ids remain parseable and are accepted only when the Host registers an exact point/version contract.
- `validatePaletteContribution` validates the Blueprint component Palette v1 descriptor and its stable identity semantics.
- `PALETTE_CONTRIBUTION_V1_SCHEMA` exposes the Palette runtime Schema object.
- `@prodivix/plugin-contracts/schema/plugin-manifest-v1.json` exports the original JSON Schema from the built package.
- `@prodivix/plugin-contracts/schema/palette-contribution-v1.json` exports the original Palette JSON Schema.

Command activation references are checked only when the host supplies `knownCommandIds`. Global command identity belongs to the host command catalog and is never inferred from a contribution local id.
