export const THEME_FONT_STACKS = {
  ui: "'Mona Sans Variable', 'HarmonyOS Sans SC', 'HarmonyOS Sans', 'PingFang SC', 'Microsoft YaHei', 'Noto Sans CJK SC', 'Source Han Sans SC', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  mono: "'Monaspace Neon', 'SFMono-Regular', 'Cascadia Code', 'Noto Sans Mono CJK SC', 'Sarasa Mono SC', 'Microsoft YaHei', Menlo, Monaco, Consolas, monospace",
  canvas: '{typography.fontFamily.ui}',
} as const;

export type ThemeFontStackRole = keyof typeof THEME_FONT_STACKS;

export const OFFICIAL_THEME_FONT_FACES = [
  {
    family: 'Mona Sans Variable',
    style: 'normal',
    display: 'swap',
    weight: '200 900',
    stretch: '75% 125%',
    sources: [
      {
        url: '@fontsource-variable/mona-sans/files/mona-sans-latin-standard-normal.woff2',
        format: 'woff2',
      },
    ],
    unicodeRange:
      'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD',
  },
  {
    family: 'Mona Sans Variable',
    style: 'normal',
    display: 'swap',
    weight: '200 900',
    stretch: '75% 125%',
    sources: [
      {
        url: '@fontsource-variable/mona-sans/files/mona-sans-latin-ext-standard-normal.woff2',
        format: 'woff2',
      },
    ],
    unicodeRange:
      'U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF',
  },
  {
    family: 'HarmonyOS Sans SC',
    style: 'normal',
    display: 'swap',
    weight: '400',
    sources: [
      {
        url: '@lobehub/webfont-harmony-sans-sc/fonts/HarmonyOS_Sans_SC_Regular.woff2',
        format: 'woff2',
      },
    ],
  },
  {
    family: 'HarmonyOS Sans SC',
    style: 'normal',
    display: 'swap',
    weight: '500',
    sources: [
      {
        url: '@lobehub/webfont-harmony-sans-sc/fonts/HarmonyOS_Sans_SC_Medium.woff2',
        format: 'woff2',
      },
    ],
  },
  {
    family: 'Monaspace Neon',
    style: 'normal',
    display: 'swap',
    weight: '400',
    sources: [
      {
        url: '@fontsource/monaspace-neon/files/monaspace-neon-latin-400-normal.woff2',
        format: 'woff2',
      },
    ],
  },
  {
    family: 'Monaspace Neon',
    style: 'normal',
    display: 'swap',
    weight: '500',
    sources: [
      {
        url: '@fontsource/monaspace-neon/files/monaspace-neon-latin-500-normal.woff2',
        format: 'woff2',
      },
    ],
  },
  {
    family: 'Monaspace Neon',
    style: 'normal',
    display: 'swap',
    weight: '600',
    sources: [
      {
        url: '@fontsource/monaspace-neon/files/monaspace-neon-latin-600-normal.woff2',
        format: 'woff2',
      },
    ],
  },
] as const;
