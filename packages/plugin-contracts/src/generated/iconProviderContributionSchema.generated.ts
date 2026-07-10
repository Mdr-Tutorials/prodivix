/**
 * Generated from specs/plugins/icon-provider-contribution-v1.schema.json.
 * DO NOT EDIT. Run `pnpm --filter @prodivix/plugin-contracts generate`.
 */

export const ICON_PROVIDER_CONTRIBUTION_V1_SCHEMA_ID =
  'https://prodivix.dev/schemas/icon-provider-contribution-v1.schema.json';
export const ICON_PROVIDER_CONTRIBUTION_V1_SCHEMA_VERSION = '1.0';
export const ICON_PROVIDER_CONTRIBUTION_V1_SCHEMA: object = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  $id: 'https://prodivix.dev/schemas/icon-provider-contribution-v1.schema.json',
  title: 'IconProviderContributionV1',
  description:
    'Serializable icon provider runtime and React code generation policy.',
  $comment:
    'The host resolves icon components only through a build-attested implementation. Package URLs and executable callbacks are not part of this descriptor.',
  type: 'object',
  additionalProperties: false,
  required: [
    'schemaVersion',
    'providerId',
    'libraryId',
    'displayName',
    'package',
    'hostImplementationId',
    'exports',
    'normalization',
    'render',
    'codegen',
    'limits',
  ],
  properties: {
    $schema: {
      const:
        'https://prodivix.dev/schemas/icon-provider-contribution-v1.schema.json',
    },
    schemaVersion: { const: '1.0' },
    providerId: { $ref: '#/$defs/localId' },
    libraryId: { $ref: '#/$defs/localId' },
    displayName: { $ref: '#/$defs/label' },
    package: { $ref: '#/$defs/packageCoordinate' },
    hostImplementationId: { $ref: '#/$defs/localId' },
    exports: { $ref: '#/$defs/exports' },
    normalization: { $ref: '#/$defs/normalization' },
    render: { $ref: '#/$defs/render' },
    codegen: { $ref: '#/$defs/codegen' },
    limits: { $ref: '#/$defs/limits' },
  },
  $defs: {
    localId: {
      type: 'string',
      minLength: 1,
      maxLength: 160,
      pattern: '^[a-z][a-z0-9]*(?:[._-][a-z0-9]+)*$',
    },
    label: { type: 'string', minLength: 1, maxLength: 120, pattern: '\\S' },
    packageName: {
      type: 'string',
      minLength: 1,
      maxLength: 214,
      pattern: '^(?:@[a-z0-9][a-z0-9._-]*/)?[a-z0-9][a-z0-9._-]*$',
    },
    packageSubpath: {
      type: 'string',
      minLength: 1,
      maxLength: 240,
      pattern: '^[A-Za-z0-9_][A-Za-z0-9._-]*(?:/[A-Za-z0-9_][A-Za-z0-9._-]*)*$',
    },
    semver: {
      type: 'string',
      maxLength: 120,
      pattern:
        '^(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)(?:-[0-9A-Za-z-]+(?:\\.[0-9A-Za-z-]+)*)?(?:\\+[0-9A-Za-z-]+(?:\\.[0-9A-Za-z-]+)*)?$',
    },
    license: { type: 'string', minLength: 1, maxLength: 120, pattern: '\\S' },
    identifierAffix: {
      type: 'string',
      maxLength: 80,
      pattern: '^[A-Za-z0-9_$]*$',
    },
    propertyName: {
      type: 'string',
      minLength: 1,
      maxLength: 120,
      pattern: '^[A-Za-z_$][A-Za-z0-9_$-]*$',
    },
    packageCoordinate: {
      type: 'object',
      additionalProperties: false,
      required: ['name', 'version', 'license'],
      properties: {
        name: { $ref: '#/$defs/packageName' },
        version: { $ref: '#/$defs/semver' },
        license: { $ref: '#/$defs/license' },
      },
    },
    variant: {
      type: 'object',
      additionalProperties: false,
      required: ['id'],
      properties: {
        id: { $ref: '#/$defs/localId' },
        subpath: { $ref: '#/$defs/packageSubpath' },
        exportSuffix: { $ref: '#/$defs/identifierAffix' },
      },
    },
    exports: {
      type: 'object',
      additionalProperties: false,
      required: ['strategy'],
      properties: {
        strategy: { enum: ['named-exports', 'default-icon-subpath'] },
        subpath: { $ref: '#/$defs/packageSubpath' },
        exportPrefix: { $ref: '#/$defs/identifierAffix' },
        exportSuffix: { $ref: '#/$defs/identifierAffix' },
        variants: {
          type: 'array',
          maxItems: 32,
          items: { $ref: '#/$defs/variant' },
        },
      },
    },
    alias: {
      type: 'object',
      additionalProperties: false,
      required: ['from', 'to'],
      properties: {
        from: { type: 'string', minLength: 1, maxLength: 160, pattern: '\\S' },
        to: { type: 'string', minLength: 1, maxLength: 160, pattern: '\\S' },
      },
    },
    normalization: {
      type: 'object',
      additionalProperties: false,
      required: ['inputCase', 'exportCase'],
      properties: {
        inputCase: { enum: ['preserve', 'kebab', 'pascal'] },
        exportCase: { enum: ['preserve', 'kebab', 'pascal'] },
        stripSuffix: { $ref: '#/$defs/identifierAffix' },
        defaultVariant: { $ref: '#/$defs/localId' },
        aliases: {
          type: 'array',
          maxItems: 512,
          items: { $ref: '#/$defs/alias' },
        },
      },
    },
    size: {
      oneOf: [
        {
          type: 'object',
          additionalProperties: false,
          required: ['mode', 'prop'],
          properties: {
            mode: { const: 'prop' },
            prop: { $ref: '#/$defs/propertyName' },
          },
        },
        {
          type: 'object',
          additionalProperties: false,
          required: ['mode'],
          properties: { mode: { enum: ['style-font-size', 'style-box'] } },
        },
      ],
    },
    render: {
      type: 'object',
      additionalProperties: false,
      required: ['size'],
      properties: {
        size: { $ref: '#/$defs/size' },
        colorProp: { $ref: '#/$defs/propertyName' },
      },
    },
    codegen: {
      type: 'object',
      additionalProperties: false,
      required: ['importKind', 'sourceMode'],
      properties: {
        importKind: { enum: ['default', 'named'] },
        sourceMode: { enum: ['package', 'icon-subpath'] },
      },
    },
    limits: {
      type: 'object',
      additionalProperties: false,
      required: [
        'maxIcons',
        'maxNameLength',
        'maxResponseBytes',
        'maxCacheEntries',
      ],
      properties: {
        maxIcons: { type: 'integer', minimum: 1, maximum: 50000 },
        maxNameLength: { type: 'integer', minimum: 1, maximum: 240 },
        maxResponseBytes: { type: 'integer', minimum: 1024, maximum: 16777216 },
        maxCacheEntries: { type: 'integer', minimum: 1, maximum: 10000 },
      },
    },
  },
};
