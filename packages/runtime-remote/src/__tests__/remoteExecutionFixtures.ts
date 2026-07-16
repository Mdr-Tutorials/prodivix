import {
  createExecutableProjectSnapshot,
  createExecutionProviderDescriptor,
  createExecutionRequest,
} from '@prodivix/runtime-core';

export const createRemoteFixtureSnapshot = (
  source = 'export const value = 1;'
) =>
  createExecutableProjectSnapshot({
    workspace: {
      workspaceId: 'workspace-1',
      snapshotId: 'snapshot-1',
      partitionRevisions: { workspace: '1' },
    },
    target: {
      presetId: 'react-vite',
      framework: 'react',
      runtime: 'vite',
    },
    files: [
      { path: 'package.json', contents: '{"private":true}' },
      {
        path: 'src/main.ts',
        contents: source,
        sourceTrace: [
          {
            sourceRef: { kind: 'workspace', workspaceId: 'workspace-1' },
          },
        ],
      },
    ],
    dependencyPlan: { manifestFilePath: 'package.json' },
    entrypoints: [{ kind: 'preview', path: 'src/main.ts' }],
    capabilityRequirements: {
      preview: ['filesystem'],
      build: ['filesystem', 'build'],
      test: ['filesystem', 'test'],
    },
    publicBuildConfiguration: [],
    resourceHints: { timeoutMs: 30_000 },
    cacheHints: { dependencyInstall: 'reuse-if-matched' },
  });

export const createRemoteFixtureRequest = (requestId = 'request-1') =>
  createExecutionRequest({
    requestId,
    profile: 'preview',
    runtimeZone: 'client',
    workspace: {
      workspaceId: 'workspace-1',
      snapshotId: 'snapshot-1',
      partitionRevisions: { workspace: '1' },
    },
    invocation: {
      kind: 'workspace',
      targetRef: { kind: 'workspace', workspaceId: 'workspace-1' },
    },
    requiredCapabilities: ['filesystem'],
  });

export const remoteFixtureProvider = createExecutionProviderDescriptor({
  id: 'prodivix.remote.fixture',
  version: '1',
  displayName: 'Remote Fixture',
  isolation: 'remote-isolated',
  profiles: ['preview', 'test', 'build'],
  runtimeZones: ['client', 'test', 'build'],
  invocationKinds: ['workspace', 'test', 'build'],
  capabilities: [
    'artifacts',
    'build',
    'cancellation',
    'filesystem',
    'source-trace',
    'streaming-logs',
    'test',
  ],
});
