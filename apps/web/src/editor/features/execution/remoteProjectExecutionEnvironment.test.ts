import { describe, expect, it } from 'vitest';
import { createRemoteProjectExecutionEnvironment } from './remoteProjectExecutionEnvironment';

describe('Remote project execution composition', () => {
  it('requires the authenticated product session and exposes independent Preview/Test providers', () => {
    expect(() =>
      createRemoteProjectExecutionEnvironment({
        accessToken: ' ',
        resolveSnapshot: async () => {
          throw new Error('not reached');
        },
      })
    ).toThrow('authenticated session');

    const environment = createRemoteProjectExecutionEnvironment({
      accessToken: 'user-session-token',
      resolveSnapshot: async () => {
        throw new Error('not started');
      },
    });
    expect(environment.provider.descriptor).toMatchObject({
      id: 'prodivix.remote.preview',
      profiles: ['preview'],
      isolation: 'remote-isolated',
    });
    expect(environment.testProvider.descriptor).toMatchObject({
      id: 'prodivix.remote.test',
      profiles: ['test'],
      runtimeZones: ['test'],
      isolation: 'remote-isolated',
    });
    expect(environment.testProvider.descriptor.capabilities).not.toContain(
      'environment-binding'
    );
    expect(environment.artifacts.resolvePreviewBundle).toBeTypeOf('function');
    expect(environment.serverFunctions.invoke).toBeTypeOf('function');
  });
});
