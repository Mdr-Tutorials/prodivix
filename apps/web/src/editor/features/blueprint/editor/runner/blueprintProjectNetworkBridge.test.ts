import {
  createExecutionNetworkTrace,
  toExecutionNetworkBridgeMessage,
} from '@prodivix/runtime-core';
import { describe, expect, it } from 'vitest';
import { readBlueprintProjectNetworkBridgeMessage } from '@/editor/features/blueprint/editor/runner/blueprintProjectNetworkBridge';

const trace = createExecutionNetworkTrace({
  requestId: 'query-1:1',
  phase: 'runtime',
  runtimeZone: 'client',
  mode: 'live',
  adapter: 'core.http',
  method: 'GET',
  sanitizedUrl: 'https://api.example.test/',
  protocol: 'https',
  startedAt: 10,
  completedAt: 20,
  outcome: 'allowed',
  status: 200,
});

describe('Blueprint project Network bridge', () => {
  it('accepts only strict messages from the active local preview origin', () => {
    const value = toExecutionNetworkBridgeMessage(trace);
    expect(
      readBlueprintProjectNetworkBridgeMessage({
        provider: 'browser',
        previewUrl: 'https://preview.localhost/catalog',
        messageOrigin: 'https://preview.localhost',
        value,
      })
    ).toEqual(trace);
    expect(
      readBlueprintProjectNetworkBridgeMessage({
        provider: 'browser',
        previewUrl: 'https://preview.localhost/catalog',
        messageOrigin: 'https://attacker.example',
        value,
      })
    ).toBeUndefined();
    expect(
      readBlueprintProjectNetworkBridgeMessage({
        provider: 'remote',
        previewUrl: 'https://preview.localhost/catalog',
        messageOrigin: 'https://preview.localhost',
        value,
      })
    ).toBeUndefined();
  });
});
