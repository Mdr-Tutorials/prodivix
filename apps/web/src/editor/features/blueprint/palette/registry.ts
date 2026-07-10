import type {
  ComponentGroup,
  ComponentPreviewItem,
} from '@/editor/features/blueprint/editor/model/types';
import { getPaletteContributionReader } from '@/editor/features/blueprint/palette/host';
import { ensureNativePaletteContribution } from '@/editor/features/blueprint/palette/nativeContribution';

export type PaletteRegistrySnapshot = Readonly<{
  revision: number;
  groups: readonly ComponentGroup[];
  itemsById: ReadonlyMap<string, ComponentPreviewItem>;
  itemsByRuntimeType: ReadonlyMap<string, ComponentPreviewItem>;
}>;

const reader = getPaletteContributionReader();
let cachedSnapshot: PaletteRegistrySnapshot | undefined;

void ensureNativePaletteContribution();

export const getPaletteRegistrySnapshot = (): PaletteRegistrySnapshot => {
  const revision = reader.getRevision();
  if (cachedSnapshot?.revision === revision) return cachedSnapshot;

  const groups = reader
    .list('paletteContribution')
    .flatMap((record) => record.value.groups);
  const itemsById = new Map<string, ComponentPreviewItem>();
  const itemsByRuntimeType = new Map<string, ComponentPreviewItem>();
  groups.forEach((group) => {
    group.items.forEach((item) => {
      itemsById.set(item.id, item);
      if (item.runtimeType) itemsByRuntimeType.set(item.runtimeType, item);
    });
  });
  cachedSnapshot = Object.freeze({
    revision,
    groups: Object.freeze([...groups]),
    itemsById,
    itemsByRuntimeType,
  });
  return cachedSnapshot;
};

export const subscribePaletteRegistry = (listener: () => void) => {
  const subscription = reader.subscribe(() => {
    cachedSnapshot = undefined;
    listener();
  });
  return () => subscription.dispose();
};

export const getPaletteItemById = (
  itemId: string
): ComponentPreviewItem | undefined =>
  getPaletteRegistrySnapshot().itemsById.get(itemId);

export const getPaletteItemByRuntimeType = (
  runtimeType: string
): ComponentPreviewItem | undefined =>
  getPaletteRegistrySnapshot().itemsByRuntimeType.get(runtimeType);
