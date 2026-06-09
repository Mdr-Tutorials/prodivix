import monochromeLightManifest from '../../manifests/official/monochrome-light.json';
import monochromeDarkManifest from '../../manifests/official/monochrome-dark.json';
import monochromeLightHighContrastManifest from '../../manifests/official/monochrome-light-high-contrast.json';
import monochromeDarkHighContrastManifest from '../../manifests/official/monochrome-dark-high-contrast.json';
import type {
  ThemeFontFace,
  ThemeManifest,
} from '../schema/themeManifest.types';
import { OFFICIAL_THEME_FONT_FACES, THEME_FONT_STACKS } from './fontStacks';

const createOfficialFontFaces = (): ThemeFontFace[] =>
  OFFICIAL_THEME_FONT_FACES.map((face) => ({
    ...face,
    sources: face.sources.map((source) => ({ ...source })),
  }));

const withOfficialFontRegistry = (manifest: ThemeManifest): ThemeManifest => ({
  ...manifest,
  typography: {
    ...manifest.typography,
    fontFamily: THEME_FONT_STACKS,
  },
  fonts: {
    faces: createOfficialFontFaces(),
  },
});

export const officialMonochromeLightTheme = withOfficialFontRegistry(
  monochromeLightManifest as ThemeManifest
);

export const officialMonochromeDarkTheme = withOfficialFontRegistry(
  monochromeDarkManifest as ThemeManifest
);

export const officialMonochromeLightHighContrastTheme =
  withOfficialFontRegistry(
    monochromeLightHighContrastManifest as ThemeManifest
  );

export const officialMonochromeDarkHighContrastTheme = withOfficialFontRegistry(
  monochromeDarkHighContrastManifest as ThemeManifest
);

export const officialThemes = [
  officialMonochromeLightTheme,
  officialMonochromeDarkTheme,
  officialMonochromeLightHighContrastTheme,
  officialMonochromeDarkHighContrastTheme,
] as const satisfies readonly ThemeManifest[];

export const defaultFallbackTheme = officialMonochromeLightTheme;
