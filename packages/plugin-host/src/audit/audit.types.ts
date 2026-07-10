import type { PluginDiagnostic } from '@prodivix/plugin-contracts';
import type { CapabilityIdentity } from '#host/capability/capabilityIdentity';
import type { ContributionIdentity, PluginOwnerRef } from '#host/identity';
import type { PluginHostResult } from '#host/result';

export type PluginAuditCategory =
  | 'validation'
  | 'permission'
  | 'registry'
  | 'runtime'
  | 'cleanup'
  | 'protocol'
  | 'gateway'
  | 'security';

export type PluginAuditOutcome = 'success' | 'denied' | 'failed' | 'canceled';

export type PluginAuditEvent = Readonly<{
  eventId: string;
  occurredAt: string;
  operationId: string;
  pluginId: string;
  pluginVersion: string;
  installationId: string;
  generation: number;
  permissionRevision?: number;
  registryRevision?: number;
  category: PluginAuditCategory;
  action: string;
  outcome: PluginAuditOutcome;
  capability?: CapabilityIdentity;
  contribution?: ContributionIdentity;
  diagnosticCodes?: readonly string[];
  durationMs?: number;
  packageDigest?: string;
  runtimeArtifactPath?: string;
  runtimeArtifactDigest?: string;
}>;

export type PluginAuditEventInput = Readonly<{
  operationId: string;
  owner: PluginOwnerRef;
  pluginVersion: string;
  permissionRevision?: number;
  registryRevision?: number;
  category: PluginAuditCategory;
  action: string;
  outcome: PluginAuditOutcome;
  capability?: CapabilityIdentity;
  contribution?: ContributionIdentity;
  diagnostics?: readonly PluginDiagnostic[];
  durationMs?: number;
  packageDigest?: string;
  runtimeArtifactPath?: string;
  runtimeArtifactDigest?: string;
}>;

export type PluginAuditSink = {
  append(events: readonly PluginAuditEvent[]): Promise<PluginHostResult<void>>;
};
