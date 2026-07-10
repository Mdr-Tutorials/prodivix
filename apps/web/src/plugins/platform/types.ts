import type {
  JsonValue,
  PaletteContributionV1,
  PluginManifestV1,
} from '@prodivix/plugin-contracts';
import type {
  ContributionRegistryReader,
  Disposable,
  PluginAuditEvent,
  PluginHostResult,
  PluginHostSnapshot,
  PluginPackageSource,
  PluginTrustLevel,
} from '@prodivix/plugin-host';
import type {
  ComponentGroup,
  ComponentPreviewItem,
} from '@/editor/features/blueprint/editor/model/types';
import type {
  PaletteRuntimeProjection,
  ResolvedPaletteContribution,
} from '@/editor/features/blueprint/palette/types';

declare const externalLibraryContributionBrand: unique symbol;
declare const renderPolicyContributionBrand: unique symbol;
declare const codegenPolicyContributionBrand: unique symbol;
declare const iconProviderContributionBrand: unique symbol;

export type ResolvedExternalLibraryContribution = Readonly<{
  [externalLibraryContributionBrand]: true;
}>;

export type ResolvedRenderPolicyContribution = Readonly<{
  [renderPolicyContributionBrand]: true;
}>;

export type ResolvedCodegenPolicyContribution = Readonly<{
  [codegenPolicyContributionBrand]: true;
}>;

export type ResolvedIconProviderContribution = Readonly<{
  [iconProviderContributionBrand]: true;
}>;

export type WebContributionPointMap = {
  paletteContribution: ResolvedPaletteContribution;
  externalLibrary: ResolvedExternalLibraryContribution;
  renderPolicy: ResolvedRenderPolicyContribution;
  codegenPolicy: ResolvedCodegenPolicyContribution;
  iconProvider: ResolvedIconProviderContribution;
};

export type PaletteRegistrySnapshot = Readonly<{
  revision: number;
  groups: readonly ComponentGroup[];
  itemsById: ReadonlyMap<string, ComponentPreviewItem>;
  itemsByRuntimeType: ReadonlyMap<string, ComponentPreviewItem>;
}>;

export type PaletteQueryService = Readonly<{
  getSnapshot(): PaletteRegistrySnapshot;
  getItemById(itemId: string): ComponentPreviewItem | undefined;
  getItemByRuntimeType(runtimeType: string): ComponentPreviewItem | undefined;
  subscribe(listener: () => void): () => void;
}>;

export type WebPluginQueryServices = Readonly<{
  workspaceId: string;
  palette: PaletteQueryService;
}>;

export type TrustedWebContributionInput = Readonly<{
  id: string;
  point: keyof WebContributionPointMap;
  contractVersion: string;
  descriptor: Readonly<Record<string, JsonValue>>;
  metadata?: Readonly<Record<string, JsonValue>>;
  paletteProjection?: PaletteRuntimeProjection;
}>;

export type TrustedWebPluginInput = Readonly<{
  pluginId: string;
  displayName: string;
  version: string;
  publisher: string;
  installationId: string;
  trustLevel: Extract<PluginTrustLevel, 'core' | 'official' | 'development'>;
  publisherVerified: boolean;
  contributions: readonly TrustedWebContributionInput[];
}>;

export type TrustedPaletteContributionInput = Readonly<{
  pluginId: string;
  displayName: string;
  version: string;
  publisher?: string;
  installationId: string;
  trustLevel?: Extract<PluginTrustLevel, 'core' | 'official' | 'development'>;
  publisherVerified?: boolean;
  contributionId: string;
  descriptor: PaletteContributionV1;
  groups: readonly ComponentGroup[];
  order?: number;
}>;

export type WebPluginPackageService = Readonly<{
  install(
    input: TrustedWebPluginInput,
    signal?: AbortSignal
  ): Promise<PluginHostResult<PluginHostSnapshot>>;
  discover(
    source: PluginPackageSource
  ): Promise<PluginHostResult<PluginHostSnapshot>>;
  disable(pluginId: string): Promise<PluginHostResult<void>>;
  getSnapshot(pluginId: string): PluginHostSnapshot | undefined;
  listSnapshots(): readonly PluginHostSnapshot[];
  subscribe(listener: (snapshot: PluginHostSnapshot) => void): Disposable;
  contributions: ContributionRegistryReader<WebContributionPointMap>;
}>;

export type PaletteContributionService = Readonly<{
  workspaceId: string;
  install(
    input: TrustedPaletteContributionInput,
    signal?: AbortSignal
  ): Promise<PluginHostResult<PluginHostSnapshot>>;
  disable(pluginId: string): Promise<PluginHostResult<void>>;
}>;

export type WebPluginRuntimeServices = Readonly<{
  workspaceId: string;
  packages: WebPluginPackageService;
  paletteContributions: PaletteContributionService;
  registerCleanup(
    cleanup: () => void | Promise<void>
  ): Disposable & Readonly<{ run(): Promise<void> }>;
}>;

export type WebPluginPlatform = Readonly<{
  workspaceId: string;
  queries: WebPluginQueryServices;
  runtime: WebPluginRuntimeServices;
  getAuditEvents(): readonly PluginAuditEvent[];
  shutdown(): Promise<PluginHostResult<void>>;
}>;

export type TrustedPackageBuildResult = Readonly<{
  manifest: PluginManifestV1;
  source: PluginPackageSource;
}>;
