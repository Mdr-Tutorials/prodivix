import { COMPONENT_GROUPS } from '@/editor/features/blueprint/catalog/ComponentGroups';
import { createPaletteContributionDescriptor } from '@/editor/features/blueprint/palette/descriptor';
import { registerTrustedPaletteContribution } from '@/editor/features/blueprint/palette/host';

const CORE_PALETTE_PLUGIN_ID = '@prodivix/core';
const CORE_PALETTE_CONTRIBUTION_ID = 'blueprint.palette';
let initialization:
  ReturnType<typeof registerTrustedPaletteContribution> | undefined;

export const ensureNativePaletteContribution = () => {
  initialization ??= registerTrustedPaletteContribution({
    pluginId: CORE_PALETTE_PLUGIN_ID,
    displayName: 'Prodivix Core Palette',
    version: '0.1.0',
    installationId: 'prodivix-core',
    contributionId: CORE_PALETTE_CONTRIBUTION_ID,
    descriptor: createPaletteContributionDescriptor(COMPONENT_GROUPS),
    groups: COMPONENT_GROUPS,
    order: 0,
  });
  return initialization;
};
