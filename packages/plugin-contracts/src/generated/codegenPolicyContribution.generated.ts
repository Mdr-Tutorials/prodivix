/* eslint-disable */
/**
 * Generated from specs/plugins/codegen-policy-contribution-v1.schema.json.
 * DO NOT EDIT. Run `pnpm --filter @prodivix/plugin-contracts generate`.
 */

export type LocalId = string;
export type PackageName = string;
export type Semver = string;
export type License = string;
export type RuntimeType = string;
export type Identifier = string;
export type PackageSubpath = string;
export type JsonValue =
  | null
  | boolean
  | number
  | string
  | JsonValue[]
  | {
      [k: string]: JsonValue;
    };
export type PropertyName = string;
export type Children =
  | {
      mode: 'preserve' | 'text-only' | 'children-only' | 'none';
    }
  | {
      mode: 'text-prop';
      prop: PropertyName;
    };
export type Label = string;

/**
 * Serializable React Vite code generation policy for a contributed external library.
 */
export interface CodegenPolicyContributionV1 {
  $schema?: 'https://prodivix.dev/schemas/codegen-policy-contribution-v1.schema.json';
  schemaVersion: '1.0';
  targetPreset: 'react-vite';
  libraryId: LocalId;
  /**
   * @minItems 1
   * @maxItems 128
   */
  dependencies: Dependency[];
  /**
   * @minItems 1
   * @maxItems 1024
   */
  rules: Rule[];
  unsupported: Unsupported;
}
export interface Dependency {
  name: PackageName;
  version: Semver;
  kind: 'dependency' | 'peerDependency';
  license: License;
}
export interface Rule {
  id: LocalId;
  runtimeType: RuntimeType;
  /**
   * @minItems 1
   * @maxItems 8
   */
  elementPath: Identifier[];
  import: Import;
  props?: PropsTransform;
  children: Children;
}
export interface Import {
  packageName: PackageName;
  subpath?: PackageSubpath;
  kind: 'default' | 'named' | 'namespace';
  imported: Identifier;
  local?: Identifier;
}
export interface PropsTransform {
  defaults?: JsonObject;
  /**
   * @maxItems 128
   */
  rename?: Rename[];
  /**
   * @maxItems 128
   */
  omit?: PropertyName[];
}
export interface JsonObject {
  [k: string]: JsonValue;
}
export interface Rename {
  from: PropertyName;
  to: PropertyName;
}
export interface Unsupported {
  behavior: 'passthrough' | 'warning' | 'error';
  message?: Label;
}
