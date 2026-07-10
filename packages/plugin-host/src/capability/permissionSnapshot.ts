import type { PluginManifestV1 } from '@prodivix/plugin-contracts';
import {
  capabilityIdentityKey,
  type CapabilityIdentity,
} from '#host/capability/capabilityIdentity';
import type { PluginOwnerRef } from '#host/identity';

export type CapabilityDecisionSource =
  'host-safety' | 'administrator' | 'user' | 'trust-default';

export type CapabilityDecision = Readonly<{
  capability: CapabilityIdentity;
  decision: 'grant' | 'deny';
  source: CapabilityDecisionSource;
  reasonCode: string;
}>;

export type PermissionDecision = CapabilityDecision &
  Readonly<{
    optional: boolean;
  }>;

export type PermissionSnapshot = Readonly<{
  owner: PluginOwnerRef;
  pluginVersion: string;
  permissionRevision: number;
  policyRevision: string;
  policySource: string;
  decisions: readonly PermissionDecision[];
  granted: readonly CapabilityIdentity[];
  deniedRequired: readonly CapabilityIdentity[];
  deniedOptional: readonly CapabilityIdentity[];
}>;

export type PermissionSnapshotReader = Readonly<{
  permissionRevision: number;
  getDecision(capability: CapabilityIdentity): PermissionDecision | undefined;
  isGranted(capability: CapabilityIdentity): boolean;
}>;

export type LivePermissionGuard = Readonly<{
  getSnapshot(): PermissionSnapshot | undefined;
  isGranted(capability: CapabilityIdentity): boolean;
}>;

const freezeCapability = (capability: CapabilityIdentity): CapabilityIdentity =>
  Object.freeze({ ...capability });

export const createImmutablePermissionSnapshot = (input: {
  owner: PluginOwnerRef;
  pluginVersion: string;
  permissionRevision: number;
  policyRevision: string;
  policySource: string;
  decisions: readonly PermissionDecision[];
}): PermissionSnapshot => {
  const decisions = input.decisions.map((decision) =>
    Object.freeze({
      ...decision,
      capability: freezeCapability(decision.capability),
    })
  );
  const granted = decisions
    .filter((decision) => decision.decision === 'grant')
    .map((decision) => decision.capability);
  const deniedRequired = decisions
    .filter((decision) => !decision.optional && decision.decision === 'deny')
    .map((decision) => decision.capability);
  const deniedOptional = decisions
    .filter((decision) => decision.optional && decision.decision === 'deny')
    .map((decision) => decision.capability);

  return Object.freeze({
    owner: Object.freeze({ ...input.owner }),
    pluginVersion: input.pluginVersion,
    permissionRevision: input.permissionRevision,
    policyRevision: input.policyRevision,
    policySource: input.policySource,
    decisions: Object.freeze(decisions),
    granted: Object.freeze(granted),
    deniedRequired: Object.freeze(deniedRequired),
    deniedOptional: Object.freeze(deniedOptional),
  });
};

export const createPermissionSnapshotReader = (
  snapshot: PermissionSnapshot
): PermissionSnapshotReader => {
  const decisions = new Map(
    snapshot.decisions.map((decision) => [
      capabilityIdentityKey(decision.capability),
      decision,
    ])
  );
  return Object.freeze({
    permissionRevision: snapshot.permissionRevision,
    getDecision: (capability) =>
      decisions.get(capabilityIdentityKey(capability)),
    isGranted: (capability) =>
      decisions.get(capabilityIdentityKey(capability))?.decision === 'grant',
  });
};

export const isCapabilityGranted = (
  snapshot: PermissionSnapshot,
  capability: CapabilityIdentity
): boolean =>
  snapshot.decisions.some(
    (decision) =>
      capabilityIdentityKey(decision.capability) ===
        capabilityIdentityKey(capability) && decision.decision === 'grant'
  );

export const requestedCapabilityKeys = (
  manifest: PluginManifestV1
): ReadonlySet<string> =>
  new Set(
    manifest.capabilities.map((request) =>
      capabilityIdentityKey(
        'scope' in request
          ? { id: request.id, scope: request.scope }
          : { id: request.id }
      )
    )
  );
