import type { ComponentProps } from 'react';
import type {
  CodegenPolicyContributionV1,
  ExternalLibraryContributionV1,
  IconProviderContributionV1,
  RenderPolicyContributionV1,
} from '@prodivix/plugin-contracts';
import type { ComponentGroup } from '@/editor/features/blueprint/editor/model/types';
import { createPaletteContributionDescriptor } from '@/editor/features/blueprint/palette';
import type {
  OfficialHostModule,
  OfficialHostModuleCatalogEntry,
  TrustedWebPluginInput,
} from '@/plugins/platform';

export const NEUTRAL_PLUGIN_ID = '@prodivix/plugin-neutral-fixture';
export const NEUTRAL_PACKAGE_DIGEST =
  'sha256-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=';

export function NeutralButton({
  label = 'Neutral Button',
  ...props
}: ComponentProps<'button'> & { label?: string }) {
  return (
    <button type="button" {...props}>
      {label}
    </button>
  );
}

export function NeutralSparkIcon({
  dimension,
  tone,
  ...props
}: ComponentProps<'span'> & {
  dimension?: number | string;
  tone?: string;
}) {
  return <span aria-label={`outline spark ${dimension} ${tone}`} {...props} />;
}

export function NeutralSolidSparkIcon({
  dimension,
  tone,
  ...props
}: ComponentProps<'span'> & {
  dimension?: number | string;
  tone?: string;
}) {
  return <span aria-label={`solid spark ${dimension} ${tone}`} {...props} />;
}

export const NEUTRAL_OFFICIAL_HOST_MODULE: OfficialHostModule = Object.freeze({
  implementations: Object.freeze({
    'neutral.components': Object.freeze({
      kind: 'component-library',
      package: Object.freeze({
        name: '@neutral-ui/components',
        version: '1.2.3',
      }),
      components: Object.freeze({ Button: NeutralButton }),
    }),
    'neutral.icons': Object.freeze({
      kind: 'icon-provider',
      package: Object.freeze({
        name: '@neutral-ui/icons',
        version: '1.2.3',
      }),
      resolveExport: (
        exportName: string,
        context: Readonly<{ variantId?: string }>
      ) => {
        if (exportName !== 'SparkIcon') return null;
        return context.variantId === 'solid'
          ? NeutralSolidSparkIcon
          : NeutralSparkIcon;
      },
      listExports: () => Object.freeze(['SparkIcon']),
    }),
    'neutral.render': Object.freeze({
      kind: 'render-policy',
    }),
  }),
});

export const createNeutralOfficialHostCatalog = (
  load: () => Promise<OfficialHostModule> = async () =>
    NEUTRAL_OFFICIAL_HOST_MODULE
): readonly OfficialHostModuleCatalogEntry[] =>
  Object.freeze([
    Object.freeze({
      pluginId: NEUTRAL_PLUGIN_ID,
      packageDigest: NEUTRAL_PACKAGE_DIGEST,
      load,
    }),
  ]);

const createExternalDescriptor = (): ExternalLibraryContributionV1 => ({
  schemaVersion: '1.0',
  libraryId: 'neutral-ui',
  displayName: 'Neutral UI',
  package: {
    name: '@neutral-ui/components',
    version: '1.2.3',
    license: 'MIT',
  },
  hostImplementationId: 'neutral.components',
  exportDiscovery: { strategy: 'declared', include: ['Button'] },
  components: [
    {
      exportName: 'Button',
      componentName: 'Button',
      runtimeType: 'NeutralButton',
      props: [{ name: 'label', valueType: 'string' }],
      behaviorTags: ['input.action'],
    },
  ],
  dependencies: [
    {
      name: '@neutral-ui/icons',
      version: '1.2.3',
      kind: 'dependency',
      license: 'MIT',
    },
  ],
});

const createRenderDescriptor = (): RenderPolicyContributionV1 => ({
  schemaVersion: '1.0',
  libraryId: 'neutral-ui',
  rules: [
    {
      id: 'neutral.button',
      runtimeType: 'NeutralButton',
      componentExport: 'Button',
      children: { mode: 'text-prop', prop: 'label' },
      portal: { mode: 'inline' },
      fallback: {
        behavior: 'placeholder',
        message: 'Neutral Button is unavailable.',
      },
    },
  ],
});

const createCodegenDescriptor = (): CodegenPolicyContributionV1 => ({
  schemaVersion: '1.0',
  targetPreset: 'react-vite',
  libraryId: 'neutral-ui',
  dependencies: [
    {
      name: '@neutral-ui/components',
      version: '1.2.3',
      kind: 'dependency',
      license: 'MIT',
    },
  ],
  rules: [
    {
      id: 'neutral.button',
      runtimeType: 'NeutralButton',
      elementPath: ['Button'],
      import: {
        packageName: '@neutral-ui/components',
        kind: 'named',
        imported: 'Button',
      },
      children: { mode: 'text-prop', prop: 'label' },
    },
  ],
  unsupported: {
    behavior: 'warning',
    message: 'Neutral UI component has no React export mapping.',
  },
});

const createIconDescriptor = (
  hostImplementationId: string
): IconProviderContributionV1 => ({
  schemaVersion: '1.0',
  providerId: 'neutral-icons',
  libraryId: 'neutral-ui',
  displayName: 'Neutral Icons',
  package: {
    name: '@neutral-ui/icons',
    version: '1.2.3',
    license: 'MIT',
  },
  hostImplementationId,
  exports: {
    strategy: 'named-exports',
    exportSuffix: 'Icon',
    variants: [
      { id: 'outline', subpath: 'outline' },
      { id: 'solid', subpath: 'solid' },
    ],
  },
  normalization: {
    inputCase: 'preserve',
    exportCase: 'pascal',
    stripSuffix: 'Icon',
    defaultVariant: 'outline',
  },
  render: { size: { mode: 'prop', prop: 'dimension' }, colorProp: 'tone' },
  codegen: { importKind: 'named', sourceMode: 'package' },
  limits: {
    maxIcons: 1000,
    maxNameLength: 120,
    maxResponseBytes: 262144,
    maxCacheEntries: 256,
  },
});

export const createNeutralOfficialPlugin = (
  options: Readonly<{
    version?: string;
    label?: string;
    groupId?: string;
    itemId?: string;
    iconImplementationId?: string;
  }> = {}
): TrustedWebPluginInput => {
  const label = options.label ?? 'Neutral';
  const group: ComponentGroup = {
    id: options.groupId ?? 'neutral-components',
    title: `${label} Components`,
    source: 'external',
    items: [
      {
        id: options.itemId ?? 'neutral-button',
        name: `${label} Button`,
        libraryId: 'neutral-ui',
        runtimeType: 'NeutralButton',
        defaultProps: { tone: 'default' },
        preview: <NeutralButton label={`${label} Preview`} />,
      },
    ],
  };
  const paletteDescriptor = createPaletteContributionDescriptor([group], {
    externalLibraryId: 'neutral-ui',
  });
  const externalDescriptor = createExternalDescriptor();
  const renderDescriptor = createRenderDescriptor();
  const codegenDescriptor = createCodegenDescriptor();
  const iconDescriptor = createIconDescriptor(
    options.iconImplementationId ?? 'neutral.icons'
  );

  return Object.freeze({
    pluginId: NEUTRAL_PLUGIN_ID,
    displayName: `${label} Official Fixture`,
    version: options.version ?? '1.0.0',
    publisher: 'prodivix',
    installationId: `fixture:${NEUTRAL_PLUGIN_ID}`,
    trustLevel: 'official',
    publisherVerified: true,
    contributions: Object.freeze([
      Object.freeze({
        id: 'neutral.library',
        point: 'externalLibrary',
        contractVersion: '1.0',
        descriptor: externalDescriptor,
      }),
      Object.freeze({
        id: 'neutral.palette',
        point: 'paletteContribution',
        contractVersion: '1.0',
        descriptor: paletteDescriptor,
        paletteProjection: Object.freeze({ groups: [group] }),
      }),
      Object.freeze({
        id: 'neutral.render',
        point: 'renderPolicy',
        contractVersion: '1.0',
        descriptor: renderDescriptor,
      }),
      Object.freeze({
        id: 'neutral.codegen',
        point: 'codegenPolicy',
        contractVersion: '1.0',
        descriptor: codegenDescriptor,
      }),
      Object.freeze({
        id: 'neutral.icons',
        point: 'iconProvider',
        contractVersion: '1.0',
        descriptor: iconDescriptor,
      }),
    ]),
  });
};
