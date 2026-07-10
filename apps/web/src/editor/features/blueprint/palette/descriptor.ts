import {
  PALETTE_CONTRIBUTION_V1_SCHEMA_ID,
  type PaletteContributionV1,
  type PaletteGroupDescriptor,
  type PaletteJsonObject,
  type PaletteOptionDescriptor,
  type PalettePresentation,
  type PaletteVariantDescriptor,
} from '@prodivix/plugin-contracts';
import type {
  ComponentGroup,
  ComponentPreviewItem,
  ComponentPreviewOption,
  ComponentPreviewVariant,
} from '@/editor/features/blueprint/editor/model/types';

const toOptionDescriptor = (
  option: ComponentPreviewOption
): PaletteOptionDescriptor => ({
  id: option.id,
  label: option.label,
  value: option.value,
});

const toVariantDescriptor = (
  variant: ComponentPreviewVariant
): PaletteVariantDescriptor => ({
  id: variant.id,
  label: variant.label,
  ...(variant.scale === undefined ? {} : { scale: variant.scale }),
  ...(variant.props === undefined
    ? {}
    : { props: variant.props as PaletteJsonObject }),
});

const toPresentation = (
  item: ComponentPreviewItem
): PalettePresentation | undefined => {
  const presentation: PalettePresentation = {
    ...(item.scale === undefined ? {} : { scale: item.scale }),
    ...(item.sizeOptions?.length
      ? { sizes: item.sizeOptions.map(toOptionDescriptor) }
      : {}),
    ...(item.variants?.length
      ? { variants: item.variants.map(toVariantDescriptor) }
      : {}),
    ...(item.statusProp && item.statusLabel && item.statusOptions?.length
      ? {
          status: {
            prop: item.statusProp,
            label: item.statusLabel,
            ...(item.defaultStatus === undefined
              ? {}
              : { defaultValue: item.defaultStatus }),
            options: item.statusOptions.map(toOptionDescriptor),
          },
        }
      : {}),
  };
  return Object.keys(presentation).length > 0 ? presentation : undefined;
};

const toItemDescriptor = (item: ComponentPreviewItem) => {
  const presentation = toPresentation(item);
  return {
    kind: 'component' as const,
    id: item.id,
    label: item.name,
    ...(item.runtimeType === undefined
      ? {}
      : { runtimeType: item.runtimeType }),
    ...(item.defaultProps === undefined
      ? {}
      : { defaultProps: item.defaultProps as PaletteJsonObject }),
    ...(item.propOptions === undefined
      ? {}
      : { propOptions: item.propOptions }),
    ...(presentation === undefined ? {} : { presentation }),
  };
};

const toGroupDescriptor = (
  group: ComponentGroup,
  externalLibraryId: string | undefined
): PaletteGroupDescriptor => {
  const section = group.source ?? 'builtIn';
  return {
    id: group.id,
    label: group.title,
    placement:
      section === 'external'
        ? {
            section,
            libraryId: externalLibraryId ?? group.items[0]?.libraryId ?? '',
          }
        : { section },
    items: group.items.map(toItemDescriptor),
  };
};

export const createPaletteContributionDescriptor = (
  groups: readonly ComponentGroup[],
  options: Readonly<{ externalLibraryId?: string }> = {}
): PaletteContributionV1 => ({
  $schema: PALETTE_CONTRIBUTION_V1_SCHEMA_ID,
  schemaVersion: '1.0',
  surface: 'blueprint.components',
  groups: groups.map((group) =>
    toGroupDescriptor(group, options.externalLibraryId)
  ),
});
