import { describe, expect, it } from 'vitest';
import {
  createExecutionNetworkTrace,
  createExecutionSecretLeakGuard,
  EXECUTION_SECRET_LEAK_SURFACES,
  projectExecutableProjectRuntimeFiles,
  readExecutionNetworkTraceValue,
  toExecutionNetworkTraceValue,
  type ExecutableProjectSnapshot,
} from '@prodivix/runtime-core';
import {
  generateWorkspaceReactViteExecutableProject,
  generateWorkspaceVueViteExecutableProject,
} from '@prodivix/prodivix-compiler';
import type { WorkspaceSnapshot } from '@prodivix/workspace';
import { authorGoldenWorkspace } from './goldenAuthoring';
import {
  GOLDEN_ASSET_MATERIALIZATIONS,
  GOLDEN_CODEGEN_POLICY,
} from './goldenApp.fixture';
import {
  GOLDEN_G2_VUE_DATA_PROVISION,
  GOLDEN_G2_VUE_WORKSPACE,
} from './goldenG2VueTargetFixture';

const secretCanary = 'g2-data-security-secret-canary';

const snapshotFor = (
  target: 'react-vite' | 'vue-vite'
): ExecutableProjectSnapshot => {
  const dataDocument = GOLDEN_G2_VUE_WORKSPACE.docsById['data-products'];
  if (!dataDocument)
    throw new Error('Golden Data security document is unavailable.');
  let workspace: WorkspaceSnapshot;
  if (target === 'react-vite') {
    const base = authorGoldenWorkspace().editedWorkspace;
    const root = base.treeById[base.treeRootId];
    if (!root || root.kind !== 'dir')
      throw new Error('Golden React Workspace root is unavailable.');
    workspace = {
      ...base,
      id: 'golden-g2-data-security-react',
      treeById: {
        ...base.treeById,
        [base.treeRootId]: {
          ...root,
          children: [...(root.children ?? []), 'data-security-node'],
        },
        'data-security-node': {
          id: 'data-security-node',
          kind: 'doc',
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
  } else {
    workspace = Object.freeze({
      ...GOLDEN_G2_VUE_WORKSPACE,
      id: 'golden-g2-data-security-vue',
    });
  }
  const result =
    target === 'react-vite'
      ? generateWorkspaceReactViteExecutableProject(workspace, {
          dataMockProvision: GOLDEN_G2_VUE_DATA_PROVISION,
          codegenPolicySnapshot: GOLDEN_CODEGEN_POLICY,
          assetMaterializations: GOLDEN_ASSET_MATERIALIZATIONS,
        })
      : generateWorkspaceVueViteExecutableProject(workspace, {
          dataMockProvision: GOLDEN_G2_VUE_DATA_PROVISION,
        });
  if (result.status === 'blocked')
    throw new Error(
      `${target} Data security snapshot blocked: ${JSON.stringify(result.diagnostics)}`
    );
  return result.snapshot;
};

describe('G2 Data D8 security matrix', () => {
  it('blocks one Secret canary on every durable and product execution surface', () => {
    const guard = createExecutionSecretLeakGuard({
      secretValues: [secretCanary],
    });
    for (const surface of EXECUTION_SECRET_LEAK_SURFACES) {
      const inspection = guard.inspectValue(surface, {
        nested: [{ value: `prefix:${secretCanary}:suffix` }],
      });
      expect(inspection).toEqual({
        safe: false,
        surface,
        reason: 'secret-canary',
      });
      expect(JSON.stringify(inspection)).not.toContain(secretCanary);
    }
  });

  it('accepts only metadata-only Network values and rejects credential-bearing drift', () => {
    const trace = createExecutionNetworkTrace({
      requestId: 'd8-network-1',
      phase: 'runtime',
      runtimeZone: 'client',
      mode: 'live',
      adapter: 'core.http',
      method: 'POST',
      sanitizedUrl: 'https://api.example.test/',
      protocol: 'https',
      startedAt: 100,
      completedAt: 120,
      outcome: 'allowed',
      status: 201,
      requestBytes: 20,
      responseBytes: 30,
      correlation: {
        kind: 'data-operation',
        documentId: 'data-products',
        operationId: 'create-product',
        invocationId: 'invocation-1',
        sequence: 1,
        attempt: 1,
      },
    });
    const value = toExecutionNetworkTraceValue(trace);
    const record = value as unknown as Readonly<Record<string, unknown>>;
    const correlation = record.correlation as Readonly<Record<string, unknown>>;
    expect(readExecutionNetworkTraceValue(value)).toEqual(trace);
    expect(JSON.stringify(value)).not.toMatch(
      /header|authorization|cookie|body|query|secret|token/iu
    );

    for (const forbidden of [
      'headers',
      'authorization',
      'cookie',
      'body',
      'query',
      'secret',
      'token',
    ]) {
      expect(
        readExecutionNetworkTraceValue({
          ...record,
          [forbidden]: secretCanary,
        })
      ).toBeUndefined();
    }
    expect(
      readExecutionNetworkTraceValue({
        ...record,
        sanitizedUrl: `https://api.example.test/?token=${secretCanary}`,
      })
    ).toBeUndefined();
    expect(
      readExecutionNetworkTraceValue({
        ...record,
        correlation: {
          ...correlation,
          authorization: secretCanary,
        },
      })
    ).toBeUndefined();
  });

  it.each(['react-vite', 'vue-vite'] as const)(
    'keeps %s Workspace Test mock-only and excludes fixture state from Export',
    (target) => {
      const snapshot = snapshotFor(target);
      const testFiles = projectExecutableProjectRuntimeFiles(snapshot, 'test');
      const testManifest = testFiles.find(
        ({ path }) => path === 'public/.prodivix/data-runtime.json'
      );
      const testProvision = testFiles.find(
        ({ path }) => path === 'public/.prodivix/data-mock-provision.json'
      );
      const exportFiles = projectExecutableProjectRuntimeFiles(
        snapshot,
        'build'
      );

      expect(testManifest?.contents).toContain('"mode":"mock"');
      expect(testManifest?.contents).not.toContain('"mode":"live"');
      expect(testProvision?.contents).toContain('golden-g2-vue-crud');
      expect(snapshot.capabilityRequirements.test).not.toContain(
        'environment-binding'
      );
      expect(snapshot.capabilityRequirements.test).not.toContain(
        'server-function'
      );
      expect(
        exportFiles.some(
          ({ path }) => path === 'public/.prodivix/data-mock-provision.json'
        )
      ).toBe(false);
      expect(JSON.stringify(testFiles)).not.toContain(secretCanary);
    }
  );
});
