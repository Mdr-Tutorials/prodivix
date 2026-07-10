export {
  WebPluginPlatformProvider,
  usePaletteGroups,
  usePaletteQueryService,
  usePaletteRegistrySnapshot,
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
export type {
  PaletteContributionService,
  PaletteQueryService,
  PaletteRegistrySnapshot,
  TrustedPaletteContributionInput,
  TrustedWebContributionInput,
  TrustedWebPluginInput,
  WebContributionPointMap,
  WebPluginPackageService,
  WebPluginPlatform,
  WebPluginQueryServices,
  WebPluginRuntimeServices,
} from '@/plugins/platform/types';
