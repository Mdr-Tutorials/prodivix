import { describe, expect, it } from 'vitest';
import {
  BUILT_IN_PROTOCOL_CONTRACTS,
  createProtocolContractRegistry,
} from '#protocol/index';

describe('protocol contract registry', () => {
  it('resolves only exact channel, method, version, and direction identities', () => {
    const created = createProtocolContractRegistry(BUILT_IN_PROTOCOL_CONTRACTS);
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    expect(
      created.value.require({
        channel: 'gateway',
        method: 'runtime.health/ping',
        contractVersion: '1.0',
        kind: 'request',
      }).ok
    ).toBe(true);
    const unknownVersion = created.value.require({
      channel: 'gateway',
      method: 'runtime.health/ping',
      contractVersion: '1.1',
      kind: 'request',
    });
    expect(unknownVersion.ok).toBe(false);
    expect(unknownVersion.diagnostics[0]?.code).toBe('PLG-4021');
  });

  it('rejects duplicate exact registrations', () => {
    const contract = BUILT_IN_PROTOCOL_CONTRACTS[0]!;
    const result = createProtocolContractRegistry([contract, contract]);

    expect(result.ok).toBe(false);
    expect(result.diagnostics[0]?.code).toBe('PLG-4021');
  });

  it('validates payload shape after exact lookup', () => {
    const created = createProtocolContractRegistry(BUILT_IN_PROTOCOL_CONTRACTS);
    if (!created.ok)
      throw new Error('Expected protocol contracts to register.');
    const contract = created.value.require({
      channel: 'control',
      method: 'runtime/heartbeat',
      contractVersion: '1.0',
      kind: 'request',
    });
    if (!contract.ok) throw new Error('Expected heartbeat contract.');

    expect(contract.value.validate({ nonce: 'heartbeat-1' }).ok).toBe(true);
    const invalid = contract.value.validate({ nonce: 'heartbeat-1', extra: 1 });
    expect(invalid.ok).toBe(false);
    expect(invalid.diagnostics[0]?.code).toBe('PLG-4020');
  });
});
