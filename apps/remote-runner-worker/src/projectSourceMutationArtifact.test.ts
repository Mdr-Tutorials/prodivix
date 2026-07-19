import {
  createExecutableProjectSnapshot,
  createExecutionFilesystemDiff,
  decodeExecutionFilesystemDiff,
  encodeExecutionFilesystemDiff,
  EXECUTABLE_PROJECT_SERVER_FUNCTION_PLAN_FORMAT,
  EXECUTION_FILESYSTEM_DIFF_FORMAT,
  EXECUTION_FILESYSTEM_DIFF_MEDIA_TYPE,
  type ExecutionFilesystemDiffChangeInput,
} from '@prodivix/runtime-core';
import {
  EXECUTION_SERVER_FUNCTION_BRIDGE_RESPONSE_TYPE,
  isIsolatedServerFunctionProjectSourceMutationDefinition,
  readIsolatedServerFunctionPlan,
  type ExecutionServerFunctionBridgeResponse,
} from '@prodivix/server-runtime';
import { describe, expect, it } from 'vitest';
import { readRemoteWorkerProjectSourceMutationArtifact } from './projectSourceMutationArtifact';

const targetPath = 'src/.prodivix-project-source/module-002.ts';
const targetArtifactId = 'code-project-helper';
const baseline = new TextEncoder().encode(`export const value = 'before';\n`);
const replacement = new TextEncoder().encode(`export const value = 'after';\n`);
const targetTrace = Object.freeze([
  Object.freeze({
    sourceRef: Object.freeze({
      kind: 'code-artifact' as const,
      artifactId: targetArtifactId,
    }),
    label: '/project-helper.ts',
  }),
]);

const snapshot = createExecutableProjectSnapshot({
  workspace: {
    workspaceId: 'workspace-1',
    snapshotId: 'snapshot-1',
    partitionRevisions: { code: 'revision-1' },
  },
  target: {
    presetId: 'isolated-server-function',
    framework: 'typescript',
    runtime: 'node',
  },
  files: [
    { path: 'package.json', contents: '{"private":true}' },
    {
      path: 'src/.prodivix/server-runtime/invoke.mjs',
      contents: 'export {};',
      sourceTrace: [
        {
          sourceRef: { kind: 'code-artifact', artifactId: 'code-root' },
        },
      ],
    },
    {
      path: 'src/.prodivix/server-runtime/function.mjs',
      contents: 'export const mutate = () => ({ kind: "value", value: true });',
      sourceTrace: [
        {
          sourceRef: { kind: 'code-artifact', artifactId: 'code-root' },
        },
      ],
    },
    {
      path: 'src/.prodivix-project-source/module-001.ts',
      contents: 'export const root = true;\n',
      sourceTrace: [
        {
          sourceRef: { kind: 'code-artifact', artifactId: 'code-root' },
          label: '/root.ts',
        },
      ],
    },
    { path: targetPath, contents: baseline, sourceTrace: targetTrace },
  ],
  dependencyPlan: { manifestFilePath: 'package.json' },
  entrypoints: [
    {
      kind: 'production',
      path: 'src/.prodivix/server-runtime/invoke.mjs',
    },
  ],
  capabilityRequirements: {
    preview: [],
    build: [],
    test: [],
    production: [
      'artifacts',
      'cancellation',
      'dependency-install',
      'filesystem',
      'server-function',
      'source-trace',
      'streaming-logs',
      'timeout',
    ],
  },
  serverFunctionPlan: {
    format: EXECUTABLE_PROJECT_SERVER_FUNCTION_PLAN_FORMAT,
    command: {
      command: 'node',
      args: ['src/.prodivix/server-runtime/invoke.mjs'],
    },
    entrypointFilePath: 'src/.prodivix/server-runtime/invoke.mjs',
    sourceFilePath: 'src/.prodivix/server-runtime/function.mjs',
    functionRef: { artifactId: 'code-root', exportName: 'mutate' },
    runtimeManifest: {
      schemaVersion: '1.0',
      functionsByExport: {
        mutate: {
          kind: 'function',
          runtimeZone: 'server',
          adapterId: 'prodivix.code-export',
          effect: 'mutation',
          auth: { kind: 'permission', permissionId: 'workspace.write' },
          idempotency: { kind: 'invocation-key' },
          inputSchema: true,
          outputSchema: true,
        },
      },
    },
  },
});

const response: ExecutionServerFunctionBridgeResponse = Object.freeze({
  type: EXECUTION_SERVER_FUNCTION_BRIDGE_RESPONSE_TYPE,
  requestId: 'invocation-1:1',
  ok: true,
  result: Object.freeze({ kind: 'value', value: true }),
});

const artifact = (
  changes: readonly ExecutionFilesystemDiffChangeInput[],
  complete = true
) => {
  const diff = createExecutionFilesystemDiff({
    snapshotDigest: snapshot.contentDigest,
    workspace: snapshot.workspace,
    capturedAt: 1_000,
    complete,
    changes,
  });
  const traces = diff.changes.flatMap((change) => change.sourceTrace ?? []);
  return Object.freeze({
    artifactId: `filesystem-diff:${snapshot.contentDigest}`,
    kind: 'report' as const,
    label: 'Remote runtime filesystem changes',
    mediaType: EXECUTION_FILESYSTEM_DIFF_MEDIA_TYPE,
    metadata: Object.freeze({
      format: EXECUTION_FILESYSTEM_DIFF_FORMAT,
      snapshotDigest: snapshot.contentDigest,
      workspaceSnapshotId: snapshot.workspace.snapshotId,
      changeCount: String(diff.changes.length),
      complete: String(diff.complete),
    }),
    sourceTrace: Object.freeze(traces),
    contents: encodeExecutionFilesystemDiff(diff),
  });
};

const validChange = (): ExecutionFilesystemDiffChangeInput =>
  Object.freeze({
    kind: 'modified',
    path: targetPath,
    baseline: { contents: baseline },
    runtime: { contents: replacement },
    sourceTrace: targetTrace,
  });

describe('remote worker project-source mutation artifact', () => {
  it('accepts one complete correlated modification of a traced staging file', () => {
    const candidate = artifact([validChange()]);
    const isolated = readIsolatedServerFunctionPlan(
      snapshot.serverFunctionPlan
    );
    expect(isolated).toBeDefined();
    expect(
      isolated &&
        isIsolatedServerFunctionProjectSourceMutationDefinition(
          isolated.definition
        )
    ).toBe(true);
    const decoded = decodeExecutionFilesystemDiff(candidate.contents);
    expect(decoded).toMatchObject({
      complete: true,
      changes: [
        {
          kind: 'modified',
          path: targetPath,
          sourceTrace: targetTrace,
        },
      ],
    });
    const change = decoded.changes[0]!;
    const snapshotFile = snapshot.files.find(
      ({ path }) => path === targetPath
    )!;
    expect(decoded.workspace).toEqual(snapshot.workspace);
    expect(
      Buffer.from(change.baseline!.contents).equals(
        Buffer.from(snapshotFile.contents)
      )
    ).toBe(true);
    expect(change.sourceTrace).toEqual(snapshotFile.sourceTrace);
    expect(candidate.sourceTrace).toEqual(snapshotFile.sourceTrace);
    expect(candidate.metadata).toEqual({
      format: decoded.format,
      snapshotDigest: snapshot.contentDigest,
      workspaceSnapshotId: snapshot.workspace.snapshotId,
      changeCount: '1',
      complete: 'true',
    });
    expect(
      readRemoteWorkerProjectSourceMutationArtifact({
        snapshot,
        response,
        artifacts: [candidate],
      })
    ).toMatchObject({ targetArtifactId });
  });

  it('fails closed on missing, failed, incomplete, extra, added, and untraced changes', () => {
    const failedResponse: ExecutionServerFunctionBridgeResponse = {
      type: EXECUTION_SERVER_FUNCTION_BRIDGE_RESPONSE_TYPE,
      requestId: 'invocation-1:1',
      ok: false,
      error: { code: 'SVR_SOURCE_MUTATION_INVALID', retryable: false },
    };
    const cases = [
      { response, artifacts: [] },
      { response: failedResponse, artifacts: [artifact([validChange()])] },
      { response, artifacts: [artifact([validChange()], false)] },
      {
        response,
        artifacts: [
          artifact([
            validChange(),
            {
              kind: 'added',
              path: 'src/.prodivix-project-source/module-003.ts',
              runtime: { contents: replacement },
            },
          ]),
        ],
      },
      {
        response,
        artifacts: [
          artifact([
            {
              kind: 'added',
              path: 'src/.prodivix-project-source/extra.ts',
              runtime: { contents: replacement },
            },
          ]),
        ],
      },
      {
        response,
        artifacts: [
          artifact([
            {
              ...validChange(),
              sourceTrace: undefined,
            },
          ]),
        ],
      },
    ];
    for (const candidate of cases)
      expect(
        readRemoteWorkerProjectSourceMutationArtifact({
          snapshot,
          response: candidate.response,
          artifacts: candidate.artifacts,
        })
      ).toBeUndefined();
  });

  it('rejects invalid UTF-8, NUL, baseline drift, and descriptor drift', () => {
    const mutations = [
      artifact([
        {
          ...validChange(),
          runtime: { contents: new Uint8Array([0xc3, 0x28]) },
        },
      ]),
      artifact([
        {
          ...validChange(),
          runtime: { contents: new TextEncoder().encode('before\0after') },
        },
      ]),
      artifact([
        {
          ...validChange(),
          baseline: { contents: new TextEncoder().encode('drift') },
        },
      ]),
      {
        ...artifact([validChange()]),
        metadata: { complete: 'true' },
      },
    ];
    for (const candidate of mutations)
      expect(
        readRemoteWorkerProjectSourceMutationArtifact({
          snapshot,
          response,
          artifacts: [candidate],
        })
      ).toBeUndefined();
  });

  it('rejects unchanged, escaped, partial-trace, and duplicate diff artifacts', () => {
    const canonical = artifact([validChange()]);
    const unchangedWire = JSON.parse(
      Buffer.from(canonical.contents).toString('utf8')
    ) as {
      changes: Array<{ baseline?: unknown; runtime?: unknown }>;
    };
    unchangedWire.changes[0]!.runtime = unchangedWire.changes[0]!.baseline;
    const unchanged = {
      ...canonical,
      contents: new TextEncoder().encode(JSON.stringify(unchangedWire)),
    };
    const escaped = artifact([
      {
        ...validChange(),
        path: 'src/escaped.ts',
      },
    ]);
    const partialTrace = artifact([
      {
        ...validChange(),
        sourceTrace: [
          {
            ...targetTrace[0]!,
            sourceSpan: {
              artifactId: targetArtifactId,
              startLine: 1,
              startColumn: 1,
              endLine: 1,
              endColumn: 2,
            },
          },
        ],
      },
    ]);
    for (const artifacts of [
      [unchanged],
      [escaped],
      [partialTrace],
      [canonical, artifact([validChange()])],
    ])
      expect(
        readRemoteWorkerProjectSourceMutationArtifact({
          snapshot,
          response,
          artifacts,
        })
      ).toBeUndefined();
  });
});
