export const DEFAULT_PREVIEW_SCALE = 0.72;
export const COMPACT_PREVIEW_SCALE = 0.6;
const WIDE_PREVIEW_SCALE_BOOST = 1.18;

export const getPreviewScale = (
  baseScale: number | undefined,
  isWide: boolean
) => {
  const resolved = baseScale ?? DEFAULT_PREVIEW_SCALE;
  if (!isWide) return resolved;
  return Math.min(resolved * WIDE_PREVIEW_SCALE_BOOST, 0.95);
};
