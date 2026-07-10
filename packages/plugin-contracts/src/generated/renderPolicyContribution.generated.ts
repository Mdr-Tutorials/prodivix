/* eslint-disable */
/**
 * Generated from specs/plugins/render-policy-contribution-v1.schema.json.
 * DO NOT EDIT. Run `pnpm --filter @prodivix/plugin-contracts generate`.
 */

export type LocalId = string;
export type RuntimeType = string;
export type ExportName = string;
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
 * Serializable canvas-safe component rendering policy for a contributed external library.
 */
export interface RenderPolicyContributionV1 {
  $schema?: 'https://prodivix.dev/schemas/render-policy-contribution-v1.schema.json';
  schemaVersion: '1.0';
  libraryId: LocalId;
  /**
   * @minItems 1
   * @maxItems 1024
   */
  rules: Rule[];
}
export interface Rule {
  id: LocalId;
  runtimeType: RuntimeType;
  componentExport: ExportName;
  props?: PropsTransform;
  children: Children;
  portal: Portal;
  fallback: Fallback;
  hostImplementationId?: LocalId;
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
export interface Portal {
  mode: 'inline' | 'host-overlay' | 'disabled';
  canvasOpen?: CanvasOpen;
}
export interface CanvasOpen {
  prop: PropertyName;
  when: 'always' | 'selected';
  value: boolean;
}
export interface Fallback {
  behavior: 'placeholder' | 'omit' | 'error';
  message?: Label;
}
