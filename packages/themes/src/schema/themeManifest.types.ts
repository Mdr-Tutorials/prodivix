export const CURRENT_THEME_SCHEMA_VERSION = '1.0' as const;

export type ThemeSchemaVersion = typeof CURRENT_THEME_SCHEMA_VERSION;

export type ThemeSource = 'official' | 'custom' | 'community';

export type ThemeMode = 'light' | 'dark' | 'adaptive';

export type ThemeTokenPrimitive = string | number;

export type ThemeTokenTree = {
  [tokenName: string]: ThemeTokenPrimitive | ThemeTokenTree;
};

export type ThemeScaleStep =
  | '0'
  | '1'
  | '2'
  | '3'
  | '4'
  | '5'
  | '6'
  | '7'
  | '8'
  | '9'
  | '10'
  | '11'
  | '12'
  | '13';

export type ThemeColorScale = Record<ThemeScaleStep, string>;

export type ThemePalette = Record<string, ThemeColorScale>;

export type ThemeSemanticTokens = ThemeTokenTree;

export type ThemeProductTokens = ThemeTokenTree;

export type ThemeTypographyTokens = ThemeTokenTree;

export type ThemeRadiusTokens = Record<string, string>;

export type ThemeShadowTokens = Record<string, string>;

export type ThemeDensityTokens = ThemeTokenTree;

export type ThemeMotionTokens = ThemeTokenTree;

export type ThemeFontFormat = 'woff2' | 'woff';

export type ThemeFontDisplay =
  'auto' | 'block' | 'swap' | 'fallback' | 'optional';

export type ThemeFontSource = {
  url: string;
  format: ThemeFontFormat;
  bytes?: number;
};

export type ThemeFontFace = {
  family: string;
  style?: string;
  display?: ThemeFontDisplay;
  weight?: string;
  stretch?: string;
  unicodeRange?: string;
  sources: ThemeFontSource[];
};

export type ThemeFontRegistry = {
  faces: ThemeFontFace[];
};

export type ThemeManifest = {
  schemaVersion: ThemeSchemaVersion;
  id: string;
  name: string;
  author?: string;
  source: ThemeSource;
  mode: ThemeMode;
  semantic: ThemeSemanticTokens;
  product?: ThemeProductTokens;
  typography?: ThemeTypographyTokens;
  radius?: ThemeRadiusTokens;
  shadow?: ThemeShadowTokens;
  density?: ThemeDensityTokens;
  motion?: ThemeMotionTokens;
  fonts?: ThemeFontRegistry;
  metadata?: {
    description?: string;
    tags?: string[];
    preview?: string;
    license?: string;
  };
};

export type ThemeTokenSection =
  | 'palette'
  | 'semantic'
  | 'product'
  | 'typography'
  | 'radius'
  | 'shadow'
  | 'density'
  | 'motion';

export type ThemeTokenPath = `${ThemeTokenSection}.${string}`;

export type ThemeTokenIndex = Record<ThemeTokenPath, ThemeTokenPrimitive>;

export type ResolvedThemeManifest = {
  manifest: ThemeManifest;
  rawTokens: ThemeTokenIndex;
  resolvedTokens: ThemeTokenIndex;
};

export type ThemeValidationIssue = {
  path: string;
  message: string;
};

export type ThemeValidationResult =
  | {
      valid: true;
      errors: [];
    }
  | {
      valid: false;
      errors: ThemeValidationIssue[];
    };
