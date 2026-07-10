import type {
  PluginDiagnostic,
  PluginManifestV1,
} from '@prodivix/plugin-contracts';
import type { PluginOwnerRef } from '#host/identity';
import type { PluginHostResult } from '#host/result';

export type Disposable = {
  dispose(): void | Promise<void>;
};

export type PluginAvailabilityState =
  'discovered' | 'validating' | 'blocked' | 'ready' | 'disabled' | 'failed';

export type PluginRuntimeState =
  | 'not-applicable'
  | 'inactive'
  | 'activating'
  | 'active'
  | 'deactivating'
  | 'failed';

export type PluginHostSnapshot = Readonly<{
  pluginId: string;
  pluginVersion: string;
  installationId: string;
  generation: number;
  revision: number;
  availability: PluginAvailabilityState;
  runtime: PluginRuntimeState;
  permissionRevision: number;
  diagnostics: readonly PluginDiagnostic[];
}>;

export type PluginHostListener = (snapshot: PluginHostSnapshot) => void;

export type PluginTrustLevel =
  'core' | 'official' | 'verified' | 'community' | 'development';

export type PluginPackageAttestation = Readonly<{
  sourceId: string;
  packageDigest: string;
  trustLevel: PluginTrustLevel;
  publisherVerified: boolean;
  signatureKeyId?: string;
}>;

export type PluginPackageReader = {
  readManifest(signal: AbortSignal): Promise<PluginHostResult<Uint8Array>>;
  readResource(
    path: string,
    options: Readonly<{ maxBytes: number; signal: AbortSignal }>
  ): Promise<PluginHostResult<Uint8Array>>;
};

export type PluginPackageSource = Readonly<{
  installationId: string;
  attestation: PluginPackageAttestation;
  reader: PluginPackageReader;
}>;

export type PluginClock = {
  now(): string;
};

export type PluginIdFactory = {
  createId(kind: 'operation' | 'audit-event' | 'runtime-session'): string;
};

export type ValidatedPluginPackage = Readonly<{
  source: PluginPackageSource;
  owner: PluginOwnerRef;
  manifest: PluginManifestV1;
}>;
