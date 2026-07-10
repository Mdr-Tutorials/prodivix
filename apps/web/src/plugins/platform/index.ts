export {
  WebPluginPlatformProvider,
  usePaletteGroups,
  usePaletteQueryService,
  usePaletteRegistrySnapshot,
  useCodegenPolicySnapshot,
  useWebExtensionRegistrySnapshot,
  useWebPluginQueries,
  useWebPluginRuntimeServices,
  type WebPluginPlatformFactory,
  type WebPluginPlatformProviderProps,
} from '@/plugins/platform/WebPluginPlatformProvider';
export {
  createWebPluginPlatform,
  type CreateWebPluginPlatformOptions,
} from '@/plugins/platform/createWebPluginPlatform';
export {
  createWorkspaceWebPluginPlatform,
  resolveConfiguredPluginSandboxUrl,
  type CreateWorkspaceWebPluginPlatformOptions,
} from '@/plugins/platform/createWorkspaceWebPluginPlatform';
export { installNativeCorePlugin } from '@/plugins/platform/nativeCorePlugin';
export { createRendererProjectionRegistry } from '@/plugins/platform/extensionQueryService';
export {
  BUILT_IN_OFFICIAL_HOST_MODULE_CATALOG,
  createLibraryArtifactResolver,
  createOfficialHostImplementationRegistry,
  type HostPackageCoordinate,
  type LibraryArtifactResolver,
  type OfficialComponentLibraryImplementation,
  type OfficialHostImplementation,
  type OfficialHostImplementationBindingSnapshot,
  type OfficialHostImplementationRegistry,
  type OfficialHostModule,
  type OfficialHostModuleCatalogEntry,
  type OfficialIconProviderImplementation,
  type OfficialRenderPolicyImplementation,
} from '@/plugins/platform/officialHostImplementations';
export type {
  PaletteContributionService,
  PaletteQueryService,
  PaletteRegistrySnapshot,
  TrustedPaletteContributionInput,
  TrustedWebContributionInput,
  TrustedWebPluginInput,
  WebExtensionQueryService,
  WebExtensionRegistrySnapshot,
  WebContributionPointMap,
  WebPluginPackageService,
  WebPluginPlatform,
  WebPluginQueryServices,
  WebPluginRuntimeServices,
} from '@/plugins/platform/types';
