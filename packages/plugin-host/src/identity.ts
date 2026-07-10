import type { PluginId } from '@prodivix/plugin-contracts';

export type PluginOwnerRef = Readonly<{
  pluginId: PluginId;
  installationId: string;
  generation: number;
}>;

export type ContributionIdentity = Readonly<{
  pluginId: PluginId;
  contributionId: string;
}>;

export const createPluginOwnerRef = (
  pluginId: PluginId,
  installationId: string,
  generation: number
): PluginOwnerRef =>
  Object.freeze({
    pluginId,
    installationId,
    generation,
  });

export const createContributionIdentity = (
  pluginId: PluginId,
  contributionId: string
): ContributionIdentity => Object.freeze({ pluginId, contributionId });

export const isSamePluginOwner = (
  left: PluginOwnerRef,
  right: PluginOwnerRef
): boolean =>
  left.pluginId === right.pluginId &&
  left.installationId === right.installationId &&
  left.generation === right.generation;

export const isSameContributionIdentity = (
  left: ContributionIdentity,
  right: ContributionIdentity
): boolean =>
  left.pluginId === right.pluginId &&
  left.contributionId === right.contributionId;

export const pluginOwnerKey = (owner: PluginOwnerRef): string =>
  JSON.stringify([owner.pluginId, owner.installationId, owner.generation]);

export const contributionIdentityKey = (
  identity: ContributionIdentity
): string => JSON.stringify([identity.pluginId, identity.contributionId]);
