import type { ThemeFontSource } from '@prodivix/themes';

import harmonySansScMediumUrl from '@lobehub/webfont-harmony-sans-sc/fonts/HarmonyOS_Sans_SC_Medium.woff2?url';
import harmonySansScRegularUrl from '@lobehub/webfont-harmony-sans-sc/fonts/HarmonyOS_Sans_SC_Regular.woff2?url';
import monaSansLatinExtStandardNormalUrl from '@fontsource-variable/mona-sans/files/mona-sans-latin-ext-standard-normal.woff2?url';
import monaSansLatinStandardNormalUrl from '@fontsource-variable/mona-sans/files/mona-sans-latin-standard-normal.woff2?url';
import monaspaceNeonLatin400NormalUrl from '@fontsource/monaspace-neon/files/monaspace-neon-latin-400-normal.woff2?url';
import monaspaceNeonLatin500NormalUrl from '@fontsource/monaspace-neon/files/monaspace-neon-latin-500-normal.woff2?url';
import monaspaceNeonLatin600NormalUrl from '@fontsource/monaspace-neon/files/monaspace-neon-latin-600-normal.woff2?url';

const FONT_ASSET_URLS = {
  '@fontsource-variable/mona-sans/files/mona-sans-latin-standard-normal.woff2':
    monaSansLatinStandardNormalUrl,
  '@fontsource-variable/mona-sans/files/mona-sans-latin-ext-standard-normal.woff2':
    monaSansLatinExtStandardNormalUrl,
  '@lobehub/webfont-harmony-sans-sc/fonts/HarmonyOS_Sans_SC_Regular.woff2':
    harmonySansScRegularUrl,
  '@lobehub/webfont-harmony-sans-sc/fonts/HarmonyOS_Sans_SC_Medium.woff2':
    harmonySansScMediumUrl,
  '@fontsource/monaspace-neon/files/monaspace-neon-latin-400-normal.woff2':
    monaspaceNeonLatin400NormalUrl,
  '@fontsource/monaspace-neon/files/monaspace-neon-latin-500-normal.woff2':
    monaspaceNeonLatin500NormalUrl,
  '@fontsource/monaspace-neon/files/monaspace-neon-latin-600-normal.woff2':
    monaspaceNeonLatin600NormalUrl,
} as const satisfies Record<string, string>;

export const resolveThemeFontSourceUrl = (source: ThemeFontSource) => {
  return FONT_ASSET_URLS[source.url as keyof typeof FONT_ASSET_URLS];
};
