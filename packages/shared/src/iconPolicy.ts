export type IconPolicyVariant = Readonly<{
  id: string;
  subpath?: string;
  exportSuffix?: string;
}>;

export type IconPolicyNormalization = Readonly<{
  inputCase: 'preserve' | 'kebab' | 'pascal';
  exportCase: 'preserve' | 'kebab' | 'pascal';
  stripSuffix?: string;
  defaultVariant?: string;
  aliases?: readonly Readonly<{ from: string; to: string }>[];
}>;

export type IconPolicyExports = Readonly<{
  exportPrefix?: string;
  exportSuffix?: string;
  variants?: readonly IconPolicyVariant[];
}>;

export const ICON_POLICY_EXPORT_IDENTIFIER_PATTERN =
  /^[A-Za-z_$][A-Za-z0-9_$]*$/;

export const isIconPolicyExportIdentifier = (value: string) =>
  ICON_POLICY_EXPORT_IDENTIFIER_PATTERN.test(value);

const toKebabCase = (value: string) =>
  value
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .toLowerCase();

const toPascalCase = (value: string) =>
  value
    .trim()
    .split(/[^A-Za-z0-9_$]+/)
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join('');

const applyCase = (
  value: string,
  mode: IconPolicyNormalization['inputCase']
) => {
  if (mode === 'kebab') return toKebabCase(value);
  if (mode === 'pascal') return toPascalCase(value);
  return value;
};

export const normalizeIconPolicyExport = (input: {
  name: string;
  variant?: string;
  normalization: IconPolicyNormalization;
  exports: IconPolicyExports;
}) => {
  let name = applyCase(input.name.trim(), input.normalization.inputCase);
  const aliases = new Map(
    input.normalization.aliases?.map((alias) => [alias.from, alias.to]) ?? []
  );
  const visitedAliases = new Set<string>();
  while (aliases.has(name) && !visitedAliases.has(name)) {
    visitedAliases.add(name);
    name = aliases.get(name)!;
  }
  if (
    input.normalization.stripSuffix &&
    name.endsWith(input.normalization.stripSuffix)
  ) {
    name = name.slice(0, -input.normalization.stripSuffix.length);
  }
  name = applyCase(name, input.normalization.exportCase);
  const variantId = input.variant ?? input.normalization.defaultVariant;
  const variant = input.exports.variants?.find(
    (candidate) => candidate.id === variantId
  );
  return Object.freeze({
    symbol: `${input.exports.exportPrefix ?? ''}${name}${variant?.exportSuffix ?? input.exports.exportSuffix ?? ''}`,
    variant,
  });
};
