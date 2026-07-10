import type { ContributionRegistryReader } from '@prodivix/plugin-host';
import type {
  ComponentGroup,
  ComponentPreviewItem,
} from '@/editor/features/blueprint/editor/model/types';
import type {
  PaletteQueryService,
  PaletteRegistrySnapshot,
  WebContributionPointMap,
} from '@/plugins/platform/types';

const createSnapshot = (
  reader: ContributionRegistryReader<WebContributionPointMap>
): PaletteRegistrySnapshot => {
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
  return Object.freeze({
    revision: reader.getRevision(),
    groups: Object.freeze([...groups]) as readonly ComponentGroup[],
    itemsById,
    itemsByRuntimeType,
  });
};

export const createPaletteQueryService = (
  reader: ContributionRegistryReader<WebContributionPointMap>
): PaletteQueryService => {
  let cachedSnapshot: PaletteRegistrySnapshot | undefined;

  const getSnapshot = () => {
    const revision = reader.getRevision();
    if (cachedSnapshot?.revision === revision) return cachedSnapshot;
    cachedSnapshot = createSnapshot(reader);
    return cachedSnapshot;
  };

  return Object.freeze({
    getSnapshot,
    getItemById: (itemId) => getSnapshot().itemsById.get(itemId),
    getItemByRuntimeType: (runtimeType) =>
      getSnapshot().itemsByRuntimeType.get(runtimeType),
    subscribe: (listener) => {
      const subscription = reader.subscribe(() => {
        cachedSnapshot = undefined;
        listener();
      });
      return () => subscription.dispose();
    },
  });
};
