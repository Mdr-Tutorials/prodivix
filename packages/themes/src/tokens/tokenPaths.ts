import type {
  ThemeManifest,
  ThemeTokenIndex,
  ThemeTokenPath,
  ThemeTokenPrimitive,
  ThemeTokenSection,
  ThemeTokenTree,
} from '../schema/themeManifest.types';
import { DEFAULT_PALETTE } from '../palette/defaultPalette';

export const THEME_TOKEN_SECTIONS = [
  'semantic',
  'product',
  'typography',
  'radius',
  'shadow',
  'density',
  'motion',
] as const satisfies readonly Exclude<ThemeTokenSection, 'palette'>[];

const SEMANTIC_CSS_VARIABLES: Record<string, string> = {
  'semantic.surface.canvas': '--bg-canvas',
  'semantic.surface.panel': '--bg-panel',
  'semantic.surface.raised': '--bg-raised',
  'semantic.text.primary': '--text-primary',
  'semantic.text.secondary': '--text-secondary',
  'semantic.text.muted': '--text-muted',
  'semantic.text.inverse': '--text-inverse',
  'semantic.border.subtle': '--border-subtle',
  'semantic.border.default': '--border-default',
  'semantic.border.strong': '--border-strong',
  'semantic.accent.default': '--accent-color',
  'semantic.accent.hover': '--accent-hover',
  'semantic.success.default': '--success-color',
  'semantic.success.hover': '--success-hover',
  'semantic.success.subtle': '--success-subtle',
  'semantic.success.subtleHover': '--success-subtle-hover',
  'semantic.danger.default': '--danger-color',
  'semantic.danger.hover': '--danger-hover',
  'semantic.danger.subtle': '--danger-subtle',
  'semantic.danger.subtleHover': '--danger-subtle-hover',
  'semantic.warning.default': '--warning-color',
  'semantic.warning.hover': '--warning-hover',
  'semantic.warning.subtle': '--warning-subtle',
  'semantic.warning.subtleHover': '--warning-subtle-hover',
  'semantic.info.default': '--info-color',
  'semantic.info.hover': '--info-hover',
  'semantic.info.subtle': '--info-subtle',
  'semantic.info.subtleHover': '--info-subtle-hover',
};

const PRODUCT_CSS_VARIABLES: Record<string, string> = {
  'product.editor.canvasBackground': '--editor-canvas-bg',
  'product.editor.selectionOutline': '--editor-selection-outline',
  'product.editor.dropIndicator': '--editor-drop-indicator',
  'product.editorBar.background': '--editor-bar-bg',
  'product.editorBar.icon': '--editor-bar-icon',
  'product.editorBar.iconHover': '--editor-bar-icon-hover',
  'product.editorBar.iconHoverBackground': '--editor-bar-icon-hover-bg',
  'product.inspector.rowHover': '--inspector-row-hover',
  'product.inspector.fieldLabel': '--inspector-field-label',
  'product.inspector.fieldControl': '--inspector-field-control',
  'product.nodeGraph.nodeBackground': '--node-bg',
  'product.nodeGraph.nodeBorder': '--node-border',
  'product.nodeGraph.portColor': '--node-port-color',
  'product.home.logo': '--home-logo',
  'product.home.heroText': '--home-hero-text',
  'product.home.heroHighlight': '--home-hero-highlight',
  'product.home.subtitle': '--home-subtitle',
  'product.home.navIcon': '--home-nav-icon',
  'product.home.navIconHoverBg': '--home-nav-icon-hover-bg',
  'product.home.navIconHoverText': '--home-nav-icon-hover-text',
  'product.home.profileBg': '--home-profile-bg',
  'product.home.profileHoverShadow': '--home-profile-hover-shadow',
  'product.home.footerText': '--home-footer-text',
};

export const isThemeTokenTree = (value: unknown): value is ThemeTokenTree => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

export const isThemeTokenPrimitive = (
  value: unknown
): value is ThemeTokenPrimitive => {
  return typeof value === 'string' || typeof value === 'number';
};

export const flattenThemeTokens = (
  manifest: ThemeManifest
): ThemeTokenIndex => {
  const tokens: Partial<ThemeTokenIndex> = {};

  flattenTokenTree('palette', DEFAULT_PALETTE as ThemeTokenTree, tokens);

  for (const section of THEME_TOKEN_SECTIONS) {
    const sectionValue = manifest[section];

    if (!isThemeTokenTree(sectionValue)) {
      continue;
    }

    flattenTokenTree(section, sectionValue, tokens);
  }

  return tokens as ThemeTokenIndex;
};

export const tokenPathToCssVariable = (
  path: ThemeTokenPath | string
): string => {
  if (path.startsWith('palette.')) {
    return `--palette-${kebabCase(path.replace(/^palette\./, ''))}`;
  }

  const knownSemanticVariable = Object.hasOwn(SEMANTIC_CSS_VARIABLES, path)
    ? SEMANTIC_CSS_VARIABLES[path]
    : undefined;

  if (knownSemanticVariable) {
    return knownSemanticVariable;
  }

  const knownProductVariable = Object.hasOwn(PRODUCT_CSS_VARIABLES, path)
    ? PRODUCT_CSS_VARIABLES[path]
    : undefined;

  if (knownProductVariable) {
    return knownProductVariable;
  }

  if (path.startsWith('typography.fontFamily.')) {
    return `--font-family-${kebabCase(
      path.replace(/^typography\.fontFamily\./, '')
    )}`;
  }

  if (path.startsWith('typography.fontSize.')) {
    return `--font-size-${kebabCase(
      path.replace(/^typography\.fontSize\./, '')
    )}`;
  }

  if (path.startsWith('typography.lineHeight.')) {
    return `--line-height-${kebabCase(
      path.replace(/^typography\.lineHeight\./, '')
    )}`;
  }

  if (path.startsWith('typography.fontWeight.')) {
    return `--font-weight-${kebabCase(
      path.replace(/^typography\.fontWeight\./, '')
    )}`;
  }

  if (path.startsWith('radius.')) {
    return `--radius-${kebabCase(path.replace(/^radius\./, ''))}`;
  }

  if (path.startsWith('shadow.')) {
    return `--shadow-${kebabCase(path.replace(/^shadow\./, ''))}`;
  }

  if (path.startsWith('density.spacing.')) {
    return `--spacing-${kebabCase(path.replace(/^density\.spacing\./, ''))}`;
  }

  if (path.startsWith('density.controlHeight.')) {
    return `--control-height-${kebabCase(
      path.replace(/^density\.controlHeight\./, '')
    )}`;
  }

  if (path.startsWith('motion.duration.')) {
    return `--motion-duration-${kebabCase(
      path.replace(/^motion\.duration\./, '')
    )}`;
  }

  if (path.startsWith('motion.easing.')) {
    return `--motion-easing-${kebabCase(
      path.replace(/^motion\.easing\./, '')
    )}`;
  }

  return `--${kebabCase(path)}`;
};

export const extractReferencePath = (value: ThemeTokenPrimitive) => {
  if (typeof value !== 'string') {
    return undefined;
  }

  const match = value.match(/^\{([a-zA-Z0-9._-]+)\}$/);

  return match?.[1] as ThemeTokenPath | undefined;
};

const flattenTokenTree = (
  prefix: string,
  tree: ThemeTokenTree,
  tokens: Partial<ThemeTokenIndex>
) => {
  for (const [key, value] of Object.entries(tree)) {
    const path = `${prefix}.${key}`;

    if (isThemeTokenPrimitive(value)) {
      tokens[path as ThemeTokenPath] = value;
      continue;
    }

    flattenTokenTree(path, value, tokens);
  }
};

const kebabCase = (value: string) => {
  return value
    .replace(/\./g, '-')
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/_/g, '-')
    .toLowerCase();
};
