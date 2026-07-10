import { describe, expect, it } from 'vitest';
import {
  decodeProtocolJsonText,
  decodeRuntimeEnvelopeV1,
  encodeRuntimeEnvelopeV1,
  type RuntimeEnvelopeV1,
} from '#protocol/index';

const envelope = (): RuntimeEnvelopeV1 => ({
  protocol: 'prodivix.plugin-runtime',
  protocolVersion: '1.0',
  kind: 'event',
  channel: 'control',
  method: 'runtime/error',
  contractVersion: '1.0',
  messageId: 'runtime.1',
  sequence: 1,
  payload: { reasonCode: 'fixture', safeMessage: 'Fixture event.' },
});

describe('strict protocol JSON codec', () => {
  it('round-trips a valid Runtime Envelope v1', () => {
    const encoded = encodeRuntimeEnvelopeV1(envelope());

    expect(encoded.ok).toBe(true);
    if (!encoded.ok) return;
    expect(decodeRuntimeEnvelopeV1(encoded.value)).toEqual({
      ok: true,
      value: envelope(),
      diagnostics: [],
    });
  });

  it('accepts a dot-namespaced method with an explicit action segment', () => {
    const encoded = encodeRuntimeEnvelopeV1({
      ...envelope(),
      kind: 'request',
      channel: 'gateway',
      method: 'runtime.health/ping',
      payload: { nonce: 'ping-1' },
    });

    expect(encoded.ok).toBe(true);
  });

  it.each([
    ['non-string transport value', new Uint8Array([123, 125])],
    ['malformed JSON', '{"sequence":'],
    ['duplicate key', '{"value":1,"value":2}'],
    ['comment', '{"value":1/* no */}'],
    ['trailing comma', '{"value":1,}'],
    ['unpaired surrogate', '"\ud800"'],
  ])('rejects %s', (_name, source) => {
    const result = decodeProtocolJsonText(source);

    expect(result.ok).toBe(false);
    expect(result.diagnostics[0]?.code).toBe('PLG-4020');
  });

  it('enforces byte, depth, and node limits before dispatch', () => {
    expect(
      decodeProtocolJsonText(JSON.stringify({ value: 'oversized' }), {
        maxBytes: 8,
      }).ok
    ).toBe(false);
    expect(
      decodeProtocolJsonText(JSON.stringify({ a: { b: { c: true } } }), {
        maxDepth: 2,
      }).ok
    ).toBe(false);
    expect(
      decodeProtocolJsonText(JSON.stringify([1, 2, 3]), { maxNodes: 3 }).ok
    ).toBe(false);
  });

  it('rejects unknown envelope fields', () => {
    const result = decodeRuntimeEnvelopeV1(
      JSON.stringify({ ...envelope(), owner: 'forged-owner' })
    );

    expect(result.ok).toBe(false);
    expect(result.diagnostics[0]?.code).toBe('PLG-4020');
  });
});
