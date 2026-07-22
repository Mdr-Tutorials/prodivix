import {
  isSafeAnimationCssColor,
  isSafeAnimationCssFilter,
  isSafeAnimationCssTransform,
  type AnimationFrame,
  type SvgFilterDefinition,
} from '@prodivix/animation';

export type AnimationPreviewSnapshot = Readonly<{
  cssText: string;
  svgFilters: readonly SvgFilterDefinition[];
}>;

export const EMPTY_ANIMATION_PREVIEW_SNAPSHOT: AnimationPreviewSnapshot =
  Object.freeze({
    cssText: '',
    svgFilters: Object.freeze([]),
  });

const escapeCssAttributeValue = (value: string) =>
  value
    .replaceAll('\\', '\\\\')
    .replaceAll('"', '\\"')
    .replaceAll('\n', '\\a ')
    .replaceAll('\r', '\\d ')
    .replaceAll('\f', '\\c ');

const cloneSvgFilters = (
  svgFilters: readonly SvgFilterDefinition[]
): readonly SvgFilterDefinition[] =>
  Object.freeze(
    svgFilters.map((filter) => ({
      ...filter,
      primitives: filter.primitives.map((primitive) => ({
        ...primitive,
        ...(primitive.attrs ? { attrs: { ...primitive.attrs } } : {}),
      })),
    }))
  );

/** Projects an already-evaluated, transport-neutral frame for a browser renderer. */
export const projectAnimationFrameToBrowserPreview = (
  frame: AnimationFrame,
  targetDocumentId: string
): AnimationPreviewSnapshot => {
  const rules: string[] = [];
  frame.stylesByNodeId.forEach((style, nodeId) => {
    const declarations: string[] = [];
    if (style.opacity !== undefined)
      declarations.push(`opacity:${style.opacity};`);
    if (style.color && isSafeAnimationCssColor(style.color))
      declarations.push(`color:${style.color};`);
    if (style.transform && isSafeAnimationCssTransform(style.transform)) {
      declarations.push(`transform:${style.transform};`);
      declarations.push('transform-origin:center;');
    }
    if (style.filter && isSafeAnimationCssFilter(style.filter))
      declarations.push(`filter:${style.filter};`);
    if (!declarations.length) return;
    rules.push(
      `[data-pir-document-id="${escapeCssAttributeValue(targetDocumentId)}"][data-pir-node-id="${escapeCssAttributeValue(nodeId)}"] {${declarations.join('')}}`
    );
  });
  return Object.freeze({
    cssText: rules.join('\n'),
    svgFilters: cloneSvgFilters(frame.svgFilters),
  });
};
