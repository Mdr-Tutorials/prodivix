import type React from 'react';

export type PdxAspectRatio = '16:9' | '4:3' | '1:1' | '21:9';

const aspectRatioValues: Record<PdxAspectRatio, string> = {
  '16:9': '16 / 9',
  '4:3': '4 / 3',
  '1:1': '1 / 1',
  '21:9': '21 / 9',
};

export function getAspectRatioStyle(aspectRatio: PdxAspectRatio) {
  return {
    '--pdx-media-aspect-ratio': aspectRatioValues[aspectRatio],
  } as React.CSSProperties;
}

export function enumValueToKebabCase(value: string) {
  return value.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}
