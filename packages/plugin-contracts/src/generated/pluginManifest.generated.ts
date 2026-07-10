/* eslint-disable */
/**
 * Generated from specs/plugins/plugin-manifest-v1.schema.json.
 * DO NOT EDIT. Run `pnpm --filter @prodivix/plugin-contracts generate`.
 */

export type PluginId = string;
export type Semver = string;
export type PublisherId = string;
export type HttpsUri = string;
export type PackageRelativePath = string;
export type Integrity = string;
export type LocalId = string;
export type ActivationEvent =
  | {
      type: 'startup';
    }
  | {
      type: 'workspace.open';
    }
  | {
      type: 'command';
      commandId: QualifiedId;
    }
  | {
      type: 'contribution.use';
      point: ContributionPoint;
      contributionId?: LocalId;
    }
  | {
      type: 'manual';
    };
export type QualifiedId = string;
export type ContributionPoint = string;
export type CapabilityRequest =
  | {
      id:
        | 'workspace.read'
        | 'workspace.intent.dispatch'
        | 'route.read'
        | 'route.intent.dispatch'
        | 'telemetry.emit';
      reason: Reason;
      optional?: boolean;
    }
  | {
      id:
        'document.read' | 'document.write' | 'network.request' | 'secrets.read';
      scope: Scope;
      reason: Reason;
      optional?: boolean;
    }
  | {
      id: 'extension.register';
      scope: ContributionPoint;
      reason: Reason;
      optional?: boolean;
    };
export type Reason = string;
export type Scope = string;
export type ContractVersion = string;
export type JsonValue =
  | null
  | boolean
  | number
  | string
  | JsonValue[]
  | {
      [k: string]: JsonValue;
    };
export type ShortLabel = string;
export type Tag = string;

/**
 * Serializable installation and contribution declaration contract for Prodivix plugins.
 */
export interface PluginManifestV1 {
  $schema?: 'https://prodivix.dev/schemas/plugin-manifest-v1.schema.json';
  schemaVersion: '1.0';
  id: PluginId;
  displayName: string;
  description?: string;
  version: Semver;
  publisher: PublisherId;
  license?: string;
  homepage?: HttpsUri;
  repository?: HttpsUri;
  icon?: PackageRelativePath;
  engines: {
    prodivix: string;
  };
  entrypoints?: Entrypoints;
  /**
   * @maxItems 64
   */
  activationEvents?: ActivationEvent[];
  /**
   * @maxItems 64
   */
  capabilities: CapabilityRequest[];
  /**
   * @minItems 1
   * @maxItems 256
   */
  contributes: ContributionDeclaration[];
  metadata?: {
    /**
     * @maxItems 16
     */
    categories?: ShortLabel[];
    /**
     * @maxItems 32
     */
    tags?: Tag[];
  };
}
export interface Entrypoints {
  runtime?: Artifact;
  /**
   * @minItems 1
   * @maxItems 32
   */
  ui?: UiEntrypoint[];
}
export interface Artifact {
  path: PackageRelativePath;
  integrity?: Integrity;
}
export interface UiEntrypoint {
  id: LocalId;
  path: PackageRelativePath;
  integrity?: Integrity;
}
export interface ContributionDeclaration {
  id: LocalId;
  point: ContributionPoint;
  contractVersion: ContractVersion;
  source: InlineContributionSource | ResourceContributionSource;
  enabledByDefault?: boolean;
  metadata?: ContributionMetadata;
}
export interface InlineContributionSource {
  kind: 'inline';
  descriptor: {
    [k: string]: JsonValue;
  };
}
export interface ResourceContributionSource {
  kind: 'resource';
  path: PackageRelativePath;
  integrity?: Integrity;
}
export interface ContributionMetadata {
  displayName?: ShortLabel;
  description?: string;
  order?: number;
  /**
   * @maxItems 16
   */
  tags?: Tag[];
}
