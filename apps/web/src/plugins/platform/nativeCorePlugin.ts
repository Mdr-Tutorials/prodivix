import { COMPONENT_GROUPS } from '@/editor/features/blueprint/catalog/ComponentGroups';
import { createPaletteContributionDescriptor } from '@/editor/features/blueprint/palette/descriptor';
import type { PaletteContributionService } from '@/plugins/platform/types';

export const CORE_PLUGIN_ID = '@prodivix/core';

export const installNativeCorePlugin = (
  paletteContributions: PaletteContributionService,
  signal?: AbortSignal
) =>
  paletteContributions.install(
    {
      pluginId: CORE_PLUGIN_ID,
      displayName: 'Prodivix Core',
      version: '0.1.0',
      publisher: 'prodivix',
      installationId: `prodivix-core:${paletteContributions.workspaceId}`,
      trustLevel: 'core',
      publisherVerified: true,
      contributionId: 'blueprint.palette',
      descriptor: createPaletteContributionDescriptor(COMPONENT_GROUPS),
      groups: COMPONENT_GROUPS,
      order: 0,
    },
    signal
  );
