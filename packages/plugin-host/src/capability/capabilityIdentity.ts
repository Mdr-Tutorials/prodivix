import type { CapabilityRequest } from '@prodivix/plugin-contracts';

export type CapabilityIdentity = Readonly<{
  id: CapabilityRequest['id'];
  scope?: string;
}>;

export const capabilityIdentityFromRequest = (
  request: CapabilityRequest
): CapabilityIdentity =>
  Object.freeze(
    'scope' in request
      ? { id: request.id, scope: request.scope }
      : { id: request.id }
  );

export const capabilityIdentityKey = (capability: CapabilityIdentity): string =>
  JSON.stringify([capability.id, capability.scope ?? null]);

export const isSameCapabilityIdentity = (
  left: CapabilityIdentity,
  right: CapabilityIdentity
): boolean =>
  left.id === right.id &&
  (left.scope ?? undefined) === (right.scope ?? undefined);

export const compareCapabilityIdentity = (
  left: CapabilityIdentity,
  right: CapabilityIdentity
): number =>
  left.id.localeCompare(right.id) ||
  (left.scope ?? '').localeCompare(right.scope ?? '');
