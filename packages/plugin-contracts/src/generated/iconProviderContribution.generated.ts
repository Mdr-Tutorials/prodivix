/* eslint-disable */
/**
 * Generated from specs/plugins/icon-provider-contribution-v1.schema.json.
 * DO NOT EDIT. Run `pnpm --filter @prodivix/plugin-contracts generate`.
 */

export type LocalId = string;
export type Label = string;
export type PackageName = string;
export type Semver = string;
export type License = string;
export type PackageSubpath = string;
export type IdentifierAffix = string;
export type Size =
  | {
      mode: 'prop';
      prop: PropertyName;
    }
  | {
      mode: 'style-font-size' | 'style-box';
    };
export type PropertyName = string;

/**
 * Serializable icon provider runtime and React code generation policy.
 */
export interface IconProviderContributionV1 {
  $schema?: 'https://prodivix.dev/schemas/icon-provider-contribution-v1.schema.json';
  schemaVersion: '1.0';
  providerId: LocalId;
  libraryId: LocalId;
  displayName: Label;
  package: PackageCoordinate;
  hostImplementationId: LocalId;
  exports: Exports;
  normalization: Normalization;
  render: Render;
  codegen: Codegen;
  limits: Limits;
}
export interface PackageCoordinate {
  name: PackageName;
  version: Semver;
  license: License;
}
export interface Exports {
  strategy: 'named-exports' | 'default-icon-subpath';
  subpath?: PackageSubpath;
  exportPrefix?: IdentifierAffix;
  exportSuffix?: IdentifierAffix;
  /**
   * @maxItems 32
   */
  variants?: Variant[];
}
export interface Variant {
  id: LocalId;
  subpath?: PackageSubpath;
  exportSuffix?: IdentifierAffix;
}
export interface Normalization {
  inputCase: 'preserve' | 'kebab' | 'pascal';
  exportCase: 'preserve' | 'kebab' | 'pascal';
  stripSuffix?: IdentifierAffix;
  defaultVariant?: LocalId;
  /**
   * @maxItems 512
   */
  aliases?: Alias[];
}
export interface Alias {
  from: string;
  to: string;
}
export interface Render {
  size: Size;
  colorProp?: PropertyName;
}
export interface Codegen {
  importKind: 'default' | 'named';
  sourceMode: 'package' | 'icon-subpath';
}
export interface Limits {
  maxIcons: number;
  maxNameLength: number;
  maxResponseBytes: number;
  maxCacheEntries: number;
}
