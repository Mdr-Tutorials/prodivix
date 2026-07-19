import { describe, expect, it } from 'vitest';
import {
  createExecutionProviderDescriptor,
  getExecutionProviderCompatibility,
  projectExecutableProjectRuntimeFiles,
  type ExecutableProjectDataMockProvision,
  type ExecutableProjectSnapshot,
} from '@prodivix/runtime-core';
import {
  decodeRemoteExecutableProjectSnapshot,
  encodeRemoteExecutableProjectSnapshot,
  remoteBuildExecutionProviderDescriptor,
  remotePreviewExecutionProviderDescriptor,
  remoteTestExecutionProviderDescriptor,
} from '@prodivix/runtime-remote';
import {
  EXECUTION_PARENT_GATEWAY_DATA_RUNTIME_TARGET,
  generateWorkspaceReactViteExecutableProject,
  generateWorkspaceVueViteExecutableProject,
} from '@prodivix/prodivix-compiler';
import {
  decodeWorkspaceDataSourceDocument,
  type WorkspaceSnapshot,
} from '@prodivix/workspace';
import { authorGoldenWorkspace } from './goldenAuthoring';
import {
  GOLDEN_ASSET_MATERIALIZATIONS,
  GOLDEN_CODEGEN_POLICY,
} from './goldenApp.fixture';
import { createGoldenG2ExecutionRequest } from './goldenG2ExecutionFixture';
import {
  GOLDEN_G2_VUE_DATA_PROVISION,
  GOLDEN_G2_VUE_WORKSPACE,
} from './goldenG2VueTargetFixture';

const adapters = ['core.http', 'core.graphql', 'core.asyncapi'] as const;

const workspaceFor = (
  target: 'react-vite' | 'vue-vite',
  adapterId: (typeof adapters)[number]
) => {
  const document = GOLDEN_G2_VUE_WORKSPACE.docsById['data-products'];
  if (!document) throw new Error('Golden Data source fixture is unavailable.');
  const decoded = decodeWorkspaceDataSourceDocument(document);
  if (decoded.status !== 'valid')
    throw new Error('Golden Data source fixture is invalid.');
  const dataDocument = Object.freeze({
    ...document,
    content: Object.freeze({
      ...decoded.decodedContent,
      source: Object.freeze({
        ...decoded.decodedContent.source,
        adapterId,
      }),
    }),
  });
  if (target === 'react-vite') {
    const base = authorGoldenWorkspace().editedWorkspace;
    const root = base.treeById[base.treeRootId];
    if (!root || root.kind !== 'dir')
      throw new Error('Golden React Workspace root is unavailable.');
    const reactWorkspace: WorkspaceSnapshot = {
      ...base,
      id: `golden-g2-target-react-${adapterId.replace('.', '-')}`,
      treeById: {
        ...base.treeById,
        [base.treeRootId]: {
          ...root,
          children: [...(root.children ?? []), 'data-node'],
        },
        'data-node': {
          id: 'data-node',
          kind: 'doc' as const,
          name: 'products.data.json',
          parentId: base.treeRootId,
          docId: 'data-products',
        },
      },
      docsById: {
        ...base.docsById,
        'data-products': dataDocument,
      },
    };
    return reactWorkspace;
  }
  return Object.freeze({
    ...GOLDEN_G2_VUE_WORKSPACE,
    id: `golden-g2-target-${adapterId.replace('.', '-')}`,
    docsById: Object.freeze({
      'data-products': dataDocument,
    }),
  }) satisfies WorkspaceSnapshot;
};

const provisionFor = (
  adapterId: (typeof adapters)[number]
): ExecutableProjectDataMockProvision =>
  Object.freeze({
    ...GOLDEN_G2_VUE_DATA_PROVISION,
    fixtureSetId: `golden-g2-target-${adapterId.replace('.', '-')}`,
    emulatedAdapterIds: Object.freeze([adapterId]),
  });

const liveWorkspaceFor = (
  target: 'react-vite' | 'vue-vite',
  adapterId: (typeof adapters)[number],
  runtimeZone: 'client' | 'server' = 'client'
): WorkspaceSnapshot => {
  const workspace = workspaceFor(target, adapterId);
  const source = workspace.docsById['data-products'];
  if (!source || source.type !== 'data-source')
    throw new Error('Golden live Data source fixture is unavailable.');
  const read = decodeWorkspaceDataSourceDocument(source);
  if (read.status !== 'valid')
    throw new Error('Golden live Data source fixture is invalid.');
  const current = read.decodedContent;
  const sourceConfiguration =
    adapterId === 'core.http'
      ? {
          baseUrl: {
            kind: 'literal' as const,
            value: 'https://api.example.test/v1/',
          },
        }
      : {
          endpoint: {
            kind: 'literal' as const,
            value:
              adapterId === 'core.graphql'
                ? 'https://api.example.test/graphql'
                : 'https://events.example.test/v1/',
          },
        };
  const listConfiguration =
    adapterId === 'core.http'
      ? {
          method: { kind: 'literal' as const, value: 'GET' },
          path: { kind: 'literal' as const, value: '/products' },
          emptyWhen: { kind: 'literal' as const, value: 'never' },
        }
      : adapterId === 'core.graphql'
        ? {
            document: {
              kind: 'literal' as const,
              value: 'query Products { products { id name } }',
            },
            operationName: { kind: 'literal' as const, value: 'Products' },
            resultPath: { kind: 'literal' as const, value: '/products' },
            emptyWhen: { kind: 'literal' as const, value: 'empty-array' },
          }
        : {
            action: { kind: 'literal' as const, value: 'request-reply' },
            path: { kind: 'literal' as const, value: '/commands/products' },
            responseBodyPath: {
              kind: 'literal' as const,
              value: '/payload',
            },
            emptyWhen: { kind: 'literal' as const, value: 'empty-array' },
          };
  return {
    ...workspace,
    id: `${workspace.id}-live-${runtimeZone}`,
    docsById: {
      ...workspace.docsById,
      'data-products': {
        ...source,
        content: {
          ...current,
          source: {
            ...current.source,
            runtimeZone,
            configurationByKey: sourceConfiguration,
          },
          operationsById: {
            'list-products': {
              ...current.operationsById['list-products']!,
              configurationByKey: listConfiguration,
            },
          },
        },
      },
    },
  };
};

const streamWorkspaceFor = (
  target: 'react-vite' | 'vue-vite',
  adapterId: 'core.graphql' | 'core.asyncapi'
): WorkspaceSnapshot => {
  const workspace = liveWorkspaceFor(target, adapterId, 'server');
  const source = workspace.docsById['data-products'];
  if (!source || source.type !== 'data-source')
    throw new Error('Golden stream Data source fixture is unavailable.');
  const read = decodeWorkspaceDataSourceDocument(source);
  if (read.status !== 'valid')
    throw new Error('Golden stream Data source fixture is invalid.');
  return {
    ...workspace,
    id: `${workspace.id}-stream`,
    docsById: {
      ...workspace.docsById,
      'data-products': {
        ...source,
        content: {
          ...read.decodedContent,
          source: { ...read.decodedContent.source, runtimeZone: 'edge' },
          operationsById: {
            ...read.decodedContent.operationsById,
            'watch-products': {
              id: 'watch-products',
              kind: 'subscription',
              outputSchemaId: 'products',
              configurationByKey:
                adapterId === 'core.graphql'
                  ? {
                      document: {
                        kind: 'literal',
                        value:
                          'subscription WatchProducts { products { id name } }',
                      },
                      operationName: {
                        kind: 'literal',
                        value: 'WatchProducts',
                      },
                      resultPath: { kind: 'literal', value: '/products' },
                    }
                  : {
                      action: { kind: 'literal', value: 'receive' },
                      path: { kind: 'literal', value: '/events/products' },
                      responseBodyPath: {
                        kind: 'literal',
                        value: '/payload',
                      },
                    },
              policies: {},
            },
          },
        },
      },
    },
  };
};

const snapshotFor = (
  target: 'react-vite' | 'vue-vite',
  adapterId: (typeof adapters)[number]
): ExecutableProjectSnapshot => {
  const workspace = workspaceFor(target, adapterId);
  const dataMockProvision = provisionFor(adapterId);
  const result =
    target === 'react-vite'
      ? generateWorkspaceReactViteExecutableProject(workspace, {
          dataMockProvision,
          codegenPolicySnapshot: GOLDEN_CODEGEN_POLICY,
          assetMaterializations: GOLDEN_ASSET_MATERIALIZATIONS,
        })
      : generateWorkspaceVueViteExecutableProject(workspace, {
          dataMockProvision,
        });
  if (result.status === 'blocked')
    throw new Error(
      `${target}/${adapterId} unexpectedly blocked: ${JSON.stringify(result.diagnostics)}`
    );
  return result.snapshot;
};

const liveSnapshotFor = (
  target: 'react-vite' | 'vue-vite',
  adapterId: (typeof adapters)[number]
): ExecutableProjectSnapshot => {
  const workspace = liveWorkspaceFor(target, adapterId);
  const result =
    target === 'react-vite'
      ? generateWorkspaceReactViteExecutableProject(workspace, {
          codegenPolicySnapshot: GOLDEN_CODEGEN_POLICY,
          assetMaterializations: GOLDEN_ASSET_MATERIALIZATIONS,
        })
      : generateWorkspaceVueViteExecutableProject(workspace);
  if (result.status === 'blocked')
    throw new Error(
      `${target}/${adapterId} live unexpectedly blocked: ${JSON.stringify(result.diagnostics)}`
    );
  return result.snapshot;
};

const browserPreviewDescriptor = createExecutionProviderDescriptor({
  id: 'golden.browser.preview',
  version: '1',
  displayName: 'Golden Browser Preview',
  isolation: 'sandboxed',
  profiles: ['preview'],
  runtimeZones: ['client'],
  invocationKinds: ['workspace'],
  capabilities: [
    'artifacts',
    'cancellation',
    'console',
    'dependency-install',
    'filesystem',
    'network',
    'source-trace',
    'streaming-logs',
    'timeout',
  ],
});

const browserTestDescriptor = createExecutionProviderDescriptor({
  id: 'golden.browser.test',
  version: '1',
  displayName: 'Golden Browser Test',
  isolation: 'sandboxed',
  profiles: ['test'],
  runtimeZones: ['test'],
  invocationKinds: ['test'],
  capabilities: [
    'artifacts',
    'cancellation',
    'dependency-install',
    'filesystem',
    'source-trace',
    'streaming-logs',
    'test',
    'timeout',
  ],
});

describe('G2 Data protocol/target portability matrix', () => {
  it.each(adapters)(
    'keeps %s mock semantics exact across React/Vite and Vue/Vite snapshots',
    (adapterId) => {
      const react = snapshotFor('react-vite', adapterId);
      const vue = snapshotFor('vue-vite', adapterId);
      expect(react.target).toEqual({
        presetId: 'react-vite',
        framework: 'react',
        runtime: 'vite',
      });
      expect(vue.target).toEqual({
        presetId: 'vue-vite',
        framework: 'vue',
        runtime: 'vite',
      });
      expect(react.dataMockProvision).toEqual(vue.dataMockProvision);
      expect(react.dataMockProvision?.emulatedAdapterIds).toEqual([adapterId]);
      expect(
        react.files.find(({ path }) => path === 'src/prodivix-data-runtime.ts')
          ?.contents
      ).toBe(
        vue.files.find(({ path }) => path === 'src/prodivix-data-runtime.ts')
          ?.contents
      );

      for (const snapshot of [react, vue]) {
        for (const profile of ['preview', 'test'] as const) {
          const runtimeFiles = projectExecutableProjectRuntimeFiles(
            snapshot,
            profile
          );
          expect(
            runtimeFiles.find(
              ({ path }) => path === 'public/.prodivix/data-runtime.json'
            )?.contents
          ).toContain('"mode":"mock"');
          expect(
            runtimeFiles.find(
              ({ path }) => path === 'public/.prodivix/data-mock-provision.json'
            )?.contents
          ).toContain(adapterId);
        }
        const decoded = decodeRemoteExecutableProjectSnapshot(
          encodeRemoteExecutableProjectSnapshot(snapshot)
        );
        expect(decoded.contentDigest).toBe(snapshot.contentDigest);
        expect(decoded.target).toEqual(snapshot.target);
        expect(decoded.dataMockProvision).toEqual(snapshot.dataMockProvision);
      }
    }
  );

  it.each(['react-vite', 'vue-vite'] as const)(
    'keeps Browser/Remote Preview/Test and Remote Build capability closure for %s',
    (target) => {
      const snapshot = snapshotFor(target, 'core.http');
      const preview = createGoldenG2ExecutionRequest(snapshot, 'preview');
      const test = createGoldenG2ExecutionRequest(snapshot, 'test');
      const build = createGoldenG2ExecutionRequest(snapshot, 'build');
      expect(
        getExecutionProviderCompatibility(browserPreviewDescriptor, preview)
      ).toEqual({ compatible: true });
      expect(
        getExecutionProviderCompatibility(
          remotePreviewExecutionProviderDescriptor,
          preview
        )
      ).toEqual({ compatible: true });
      expect(
        getExecutionProviderCompatibility(browserTestDescriptor, test)
      ).toEqual({ compatible: true });
      expect(
        getExecutionProviderCompatibility(
          remoteTestExecutionProviderDescriptor,
          test
        )
      ).toEqual({ compatible: true });
      expect(
        getExecutionProviderCompatibility(
          remoteBuildExecutionProviderDescriptor,
          build
        )
      ).toEqual({ compatible: true });
      expect(
        getExecutionProviderCompatibility(browserPreviewDescriptor, build)
          .compatible
      ).toBe(false);
    }
  );

  it.each(
    adapters.flatMap((adapterId) =>
      (['react-vite', 'vue-vite'] as const).map(
        (target) => [target, adapterId] as const
      )
    )
  )(
    'keeps %s %s finite client live Preview/Build separate from mock-only Test',
    (target, adapterId) => {
      const live = liveSnapshotFor(target, adapterId);
      expect(live.capabilityRequirements.preview).toContain('network');
      expect(live.capabilityRequirements.preview).not.toContain(
        'environment-binding'
      );
      for (const profile of ['preview', 'build'] as const) {
        const files = projectExecutableProjectRuntimeFiles(live, profile);
        expect(
          files.find(
            ({ path }) => path === 'public/.prodivix/data-runtime.json'
          )?.contents
        ).toContain('"mode":"live"');
        expect(
          files.some(
            ({ path }) => path === 'public/.prodivix/data-mock-provision.json'
          )
        ).toBe(false);
      }
      const mock = snapshotFor(target, adapterId);
      const testFiles = projectExecutableProjectRuntimeFiles(mock, 'test');
      expect(
        testFiles.find(
          ({ path }) => path === 'public/.prodivix/data-runtime.json'
        )?.contents
      ).toContain('"mode":"mock"');
      expect(
        testFiles.find(
          ({ path }) => path === 'public/.prodivix/data-mock-provision.json'
        )?.contents
      ).toContain(adapterId);
      expect(
        getExecutionProviderCompatibility(
          remotePreviewExecutionProviderDescriptor,
          createGoldenG2ExecutionRequest(live, 'preview')
        )
      ).toEqual({ compatible: true });
      expect(
        getExecutionProviderCompatibility(
          remoteBuildExecutionProviderDescriptor,
          createGoldenG2ExecutionRequest(live, 'build')
        )
      ).toEqual({ compatible: true });
    }
  );

  it.each(
    (['core.graphql', 'core.asyncapi'] as const).flatMap((adapterId) =>
      (['react-vite', 'vue-vite'] as const).map(
        (target) => [target, adapterId] as const
      )
    )
  )(
    'projects %s %s finite server live through the audited execution gateway',
    (target, adapterId) => {
      const workspace = liveWorkspaceFor(target, adapterId, 'server');
      const result =
        target === 'react-vite'
          ? generateWorkspaceReactViteExecutableProject(workspace, {
              dataRuntimeTarget: EXECUTION_PARENT_GATEWAY_DATA_RUNTIME_TARGET,
              codegenPolicySnapshot: GOLDEN_CODEGEN_POLICY,
              assetMaterializations: GOLDEN_ASSET_MATERIALIZATIONS,
            })
          : generateWorkspaceVueViteExecutableProject(workspace, {
              dataRuntimeTarget: EXECUTION_PARENT_GATEWAY_DATA_RUNTIME_TARGET,
            });
      expect(
        result.status,
        result.status === 'blocked' ? JSON.stringify(result.diagnostics) : ''
      ).toBe('ready');
      if (result.status !== 'ready') return;
      expect(result.snapshot.capabilityRequirements.preview).toEqual(
        expect.arrayContaining(['environment-binding', 'network'])
      );
      expect(
        result.snapshot.files.find(
          ({ path }) => path === 'src/prodivix-data-runtime.ts'
        )?.contents
      ).toContain('prodivix.execution-data-gateway-request.v1');
    }
  );

  it.each(
    (['core.graphql', 'core.asyncapi'] as const).flatMap((adapterId) =>
      (['react-vite', 'vue-vite'] as const).map(
        (target) => [target, adapterId] as const
      )
    )
  )(
    'projects %s %s edge subscription with explicit data-stream capability and Remote compatibility',
    (target, adapterId) => {
      const workspace = streamWorkspaceFor(target, adapterId);
      const result =
        target === 'react-vite'
          ? generateWorkspaceReactViteExecutableProject(workspace, {
              dataRuntimeTarget: EXECUTION_PARENT_GATEWAY_DATA_RUNTIME_TARGET,
              codegenPolicySnapshot: GOLDEN_CODEGEN_POLICY,
              assetMaterializations: GOLDEN_ASSET_MATERIALIZATIONS,
            })
          : generateWorkspaceVueViteExecutableProject(workspace, {
              dataRuntimeTarget: EXECUTION_PARENT_GATEWAY_DATA_RUNTIME_TARGET,
            });
      expect(
        result.status,
        result.status === 'blocked' ? JSON.stringify(result.diagnostics) : ''
      ).toBe('ready');
      if (result.status !== 'ready') return;
      expect(result.snapshot.capabilityRequirements.preview).toEqual(
        expect.arrayContaining([
          'data-stream',
          'environment-binding',
          'network',
        ])
      );
      expect(
        getExecutionProviderCompatibility(
          remotePreviewExecutionProviderDescriptor,
          createGoldenG2ExecutionRequest(result.snapshot, 'preview')
        )
      ).toEqual({ compatible: true });
      expect(
        result.snapshot.files.find(
          ({ path }) => path === 'src/prodivix-data-runtime.ts'
        )?.contents
      ).toContain('prodivix.execution-data-stream-pull.v1');
    }
  );
});
