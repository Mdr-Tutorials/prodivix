import {
  PDX_COMPONENT_MANIFEST,
  PDX_COMPONENT_MANIFEST_BY_TYPE,
  type PdxComponentManifestEntry,
} from '@prodivix/ui';
import type {
  ComponentGroup,
  ComponentPreviewItem,
} from '@/editor/features/blueprint/editor/model/types';

const CATALOG_RUNTIME_ALIASES: Readonly<Record<string, string>> = {
  flex: 'PdxDiv',
  grid: 'PdxDiv',
};

const toCatalogItemId = (runtimeType: string) =>
  runtimeType
    .replace(/^Pdx/, '')
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .toLowerCase();

const manifestByItemId = new Map(
  PDX_COMPONENT_MANIFEST.map((component) => [
    toCatalogItemId(component.runtimeType),
    component,
  ])
);

const getManifestDefaults = (manifest: PdxComponentManifestEntry) =>
  Object.fromEntries(
    Object.entries(manifest.props)
      .filter(
        ([, prop]) =>
          prop.authoring !== 'hidden' &&
          Object.prototype.hasOwnProperty.call(prop, 'defaultValue')
      )
      .map(([name, prop]) => [name, prop.defaultValue])
  );

const getManifestPropOptions = (manifest: PdxComponentManifestEntry) =>
  Object.fromEntries(
    Object.entries(manifest.props)
      .filter(
        ([, prop]) =>
          prop.authoring !== 'hidden' && prop.options && prop.options.length > 0
      )
      .map(([name, prop]) => [name, [...(prop.options ?? [])]])
  );

const resolveManifest = (item: ComponentPreviewItem) => {
  const runtimeType =
    item.runtimeType ??
    CATALOG_RUNTIME_ALIASES[item.id] ??
    manifestByItemId.get(item.id)?.runtimeType;
  return runtimeType ? PDX_COMPONENT_MANIFEST_BY_TYPE[runtimeType] : undefined;
};

/**
 * Projects the UI package manifest into Blueprint catalog metadata so the
 * renderer allowlist, palette defaults, and generated prop options share one
 * component API source while each catalog group retains its authored preview.
 */
export const applyBuiltInManifest = (
  group: ComponentGroup
): ComponentGroup => ({
  ...group,
  items: group.items.map((item) => {
    const manifest = resolveManifest(item);
    if (!manifest) return item;

    const defaultProps = {
      ...getManifestDefaults(manifest),
      ...(item.defaultProps ?? {}),
    };
    const propOptions = {
      ...getManifestPropOptions(manifest),
      ...(item.propOptions ?? {}),
    };

    return {
      ...item,
      runtimeType: manifest.runtimeType,
      ...(Object.keys(defaultProps).length > 0 && { defaultProps }),
      ...(Object.keys(propOptions).length > 0 && { propOptions }),
    };
  }),
});
