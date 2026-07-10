import type { PaletteContributionV1 } from '@prodivix/plugin-contracts';
import type { ComponentGroup } from '@/editor/features/blueprint/editor/model/types';

export type ResolvedPaletteContribution = Readonly<{
  descriptor: PaletteContributionV1;
  groups: readonly ComponentGroup[];
}>;

export type PaletteRuntimeProjection = Readonly<{
  groups: readonly ComponentGroup[];
}>;
