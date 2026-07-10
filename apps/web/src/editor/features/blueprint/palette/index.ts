export { createPaletteContributionDescriptor } from '@/editor/features/blueprint/palette/descriptor';
export {
  disableTrustedPalettePlugin,
  getPaletteAuditEvents,
  registerTrustedPaletteContribution,
  type TrustedPaletteContributionInput,
} from '@/editor/features/blueprint/palette/host';
export {
  getPaletteItemById,
  getPaletteItemByRuntimeType,
  getPaletteRegistrySnapshot,
  subscribePaletteRegistry,
  type PaletteRegistrySnapshot,
} from '@/editor/features/blueprint/palette/registry';
export {
  usePaletteGroups,
  usePaletteRegistrySnapshot,
} from '@/editor/features/blueprint/palette/usePaletteGroups';
export type {
  BlueprintContributionPointMap,
  PaletteRuntimeProjection,
  ResolvedPaletteContribution,
} from '@/editor/features/blueprint/palette/types';
