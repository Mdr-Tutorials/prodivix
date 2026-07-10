import {
  createPluginDiagnostic,
  PLUGIN_DIAGNOSTIC_CODES,
  type PluginManifestV1,
} from '@prodivix/plugin-contracts';
import { capabilityIdentityKey } from '#host/capability/capabilityIdentity';
import {
  createImmutablePermissionSnapshot,
  type PermissionSnapshot,
} from '#host/capability/permissionSnapshot';
import type { PluginOwnerRef } from '#host/identity';
import type { PluginPackageAttestation } from '#host/host.types';
import {
  pluginHostFailure,
  pluginHostSuccess,
  type PluginHostResult,
} from '#host/result';

export type CapabilityPolicyInput = Readonly<{
  owner: PluginOwnerRef;
  manifest: PluginManifestV1;
  attestation: PluginPackageAttestation;
  nextPermissionRevision: number;
  previous?: PermissionSnapshot;
}>;

export type CapabilityPolicy = {
  resolve(
    input: CapabilityPolicyInput,
    signal: AbortSignal
  ): Promise<PluginHostResult<PermissionSnapshot>>;
};

const policyDiagnostic = (input: CapabilityPolicyInput, message: string) =>
  createPluginDiagnostic(
    PLUGIN_DIAGNOSTIC_CODES.CAPABILITY_POLICY_FAILED,
    message,
    {
      pluginId: input.owner.pluginId,
      pluginVersion: input.manifest.version,
      installationId: input.owner.installationId,
      generation: input.owner.generation,
      permissionRevision: input.nextPermissionRevision,
    }
  );

export const normalizePolicySnapshot = (
  input: CapabilityPolicyInput,
  snapshot: PermissionSnapshot
): PluginHostResult<PermissionSnapshot> => {
  const ownerMatches =
    snapshot.owner.pluginId === input.owner.pluginId &&
    snapshot.owner.installationId === input.owner.installationId &&
    snapshot.owner.generation === input.owner.generation;
  if (!ownerMatches || snapshot.pluginVersion !== input.manifest.version) {
    return pluginHostFailure([
      policyDiagnostic(
        input,
        'Capability policy returned a snapshot for another plugin owner.'
      ),
    ]);
  }
  if (snapshot.permissionRevision !== input.nextPermissionRevision) {
    return pluginHostFailure([
      policyDiagnostic(
        input,
        'Capability policy returned a stale or non-monotonic permission revision.'
      ),
    ]);
  }
  if (!snapshot.policyRevision.trim() || !snapshot.policySource.trim()) {
    return pluginHostFailure([
      policyDiagnostic(
        input,
        'Capability policy omitted its revision or source.'
      ),
    ]);
  }

  const requested = new Map(
    input.manifest.capabilities.map((request) => {
      const capability =
        'scope' in request
          ? { id: request.id, scope: request.scope }
          : { id: request.id };
      return [capabilityIdentityKey(capability), request] as const;
    })
  );
  if (snapshot.decisions.length !== requested.size) {
    return pluginHostFailure([
      policyDiagnostic(
        input,
        'Capability policy must decide every requested capability exactly once.'
      ),
    ]);
  }

  const seen = new Set<string>();
  for (const decision of snapshot.decisions) {
    const key = capabilityIdentityKey(decision.capability);
    const request = requested.get(key);
    if (!request || seen.has(key)) {
      return pluginHostFailure([
        policyDiagnostic(
          input,
          'Capability policy returned a duplicate or unrequested decision.'
        ),
      ]);
    }
    if (decision.optional !== (request.optional === true)) {
      return pluginHostFailure([
        policyDiagnostic(
          input,
          'Capability policy changed the required or optional request semantics.'
        ),
      ]);
    }
    if (!decision.reasonCode.trim()) {
      return pluginHostFailure([
        policyDiagnostic(
          input,
          'Capability policy returned an empty reason code.'
        ),
      ]);
    }
    seen.add(key);
  }

  return pluginHostSuccess(
    createImmutablePermissionSnapshot({
      owner: input.owner,
      pluginVersion: snapshot.pluginVersion,
      permissionRevision: snapshot.permissionRevision,
      policyRevision: snapshot.policyRevision,
      policySource: snapshot.policySource,
      decisions: snapshot.decisions,
    }),
    snapshot.decisions
      .filter((decision) => !decision.optional && decision.decision === 'deny')
      .map((decision) =>
        createPluginDiagnostic(
          PLUGIN_DIAGNOSTIC_CODES.REQUIRED_CAPABILITY_DENIED,
          `Required capability ${JSON.stringify(decision.capability.id)} was denied.`,
          {
            pluginId: input.owner.pluginId,
            pluginVersion: input.manifest.version,
            installationId: input.owner.installationId,
            generation: input.owner.generation,
            permissionRevision: snapshot.permissionRevision,
            capabilityId: decision.capability.id,
            capabilityScope: decision.capability.scope,
            reasonCode: decision.reasonCode,
          }
        )
      )
  );
};
