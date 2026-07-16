import { mkdtemp, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  createExecutableProjectSnapshot,
  createExecutionProviderDescriptor,
  createExecutionRequest,
} from '@prodivix/runtime-core';
import type { RemoteExecutionClaimResult } from '@prodivix/runtime-remote';
import { createFilesystemProcessSandbox } from './filesystemProcessSandbox';
import { createRemoteWorkerAgent } from './workerAgent';
import type {
  RemoteWorkerControlPlaneClient,
  RemoteWorkerSandbox,
} from './worker.types';

const snapshot = createExecutableProjectSnapshot({
  workspace: {
    workspaceId: 'workspace-1',
    snapshotId: 'snapshot-1',
    partitionRevisions: { workspace: '1' },
  },
  target: { presetId: 'node-test', framework: 'node', runtime: 'node' },
  files: [{ path: 'package.json', contents: '{"private":true}' }],
  dependencyPlan: { manifestFilePath: 'package.json' },
  entrypoints: [{ kind: 'build', path: 'package.json' }],
  capabilityRequirements: {
    preview: ['filesystem'],
    build: ['filesystem', 'build'],
    test: ['filesystem', 'test'],
  },
  publicBuildConfiguration: [],
  resourceHints: {},
  cacheHints: { dependencyInstall: 'isolated' },
  installCommand: { command: 'node', args: ['-e', 'process.exit(0)'] },
  buildCommand: {
    command: 'node',
    args: ['-e', "process.stdout.write('secret-value:' + 'x'.repeat(64))"],
  },
});

const provider = createExecutionProviderDescriptor({
  id: 'remote-worker-test',
  version: '1',
  isolation: 'remote-isolated',
  profiles: ['build'],
  runtimeZones: ['build'],
  invocationKinds: ['build'],
  capabilities: ['filesystem', 'build'],
});
const request = createExecutionRequest({
  requestId: 'request-1',
  profile: 'build',
  runtimeZone: 'build',
  workspace: snapshot.workspace,
  invocation: {
    kind: 'build',
    targetRef: { kind: 'workspace', workspaceId: 'workspace-1' },
  },
  requiredCapabilities: ['filesystem', 'build'],
});

const claim = (): RemoteExecutionClaimResult => ({
  lease: {
    workerId: 'worker-1',
    token: 'lease-1',
    attempt: 1,
    acquiredAt: 1,
    expiresAt: 100,
  },
  execution: {
    ownerId: 'owner-1',
    identityKey: 'identity-1',
    request,
    snapshotId: snapshot.workspace.snapshotId,
    record: {
      executionId: 'execution-1',
      requestId: request.requestId,
      snapshotDigest: snapshot.contentDigest,
      provider,
      status: 'starting',
      latestCursor: 2,
      createdAt: 1,
      startedAt: 2,
    },
    events: [],
    artifacts: [],
    cancellationIds: [],
    lease: {
      workerId: 'worker-1',
      token: 'lease-1',
      attempt: 1,
      acquiredAt: 1,
      expiresAt: 100,
    },
  },
});

describe('remote runner worker', () => {
  it('materializes, executes argv without a shell, redacts output, budgets it, and cleans up', async () => {
    const parent = await mkdtemp(resolve(tmpdir(), 'prodivix-worker-test-'));
    try {
      const result = await createFilesystemProcessSandbox({
        rootDirectory: parent,
      }).execute({
        executionId: 'execution-1',
        snapshot,
        profile: 'build',
        timeoutMs: 10_000,
        maximumOutputBytes: 32,
        redactValues: ['secret-value'],
        signal: new AbortController().signal,
      });
      expect(result.status).toBe('succeeded');
      expect(result.stdout).toContain('[REDACTED]');
      expect(result.stdout).not.toContain('secret-value');
      expect(result.outputTruncated).toBe(true);
      await expect(readdir(parent)).resolves.toEqual([]);
    } finally {
      await rm(parent, { recursive: true, force: true });
    }
  });

  it('transitions a claimed execution through running to its terminal result', async () => {
    const transitions: string[] = [];
    const eventKinds: string[] = [];
    let claimed = false;
    const client: RemoteWorkerControlPlaneClient = {
      async claim() {
        if (claimed) return undefined;
        claimed = true;
        return claim();
      },
      async renew() {
        return { lease: claim().lease, cancellationRequested: false };
      },
      async snapshot() {
        return snapshot;
      },
      async transition(input) {
        transitions.push(input.status);
        return true;
      },
      async appendEvent(input) {
        eventKinds.push(input.event.kind);
        return 'stored';
      },
      async uploadArtifact() {
        return 'stored';
      },
    };
    const sandbox: RemoteWorkerSandbox = {
      async execute() {
        return {
          status: 'succeeded',
          stdout: 'build complete',
          stderr: '',
          outputTruncated: true,
        };
      },
    };
    const agent = createRemoteWorkerAgent({
      workerId: 'worker-1',
      providerId: provider.id,
      client,
      sandbox,
      leaseDurationMs: 100,
      heartbeatIntervalMs: 20,
      defaultTimeoutMs: 1_000,
      defaultMaximumOutputBytes: 1_000,
    });
    await expect(agent.pollOnce()).resolves.toBe(true);
    expect(transitions).toEqual(['running', 'succeeded']);
    expect(eventKinds).toEqual(['log', 'log']);
    await expect(agent.pollOnce()).resolves.toBe(false);
  });

  it('aborts the sandbox and never publishes terminal state after lease loss', async () => {
    const transitions: string[] = [];
    const client: RemoteWorkerControlPlaneClient = {
      async claim() {
        return claim();
      },
      async renew() {
        return undefined;
      },
      async snapshot() {
        return snapshot;
      },
      async transition(input) {
        transitions.push(input.status);
        return true;
      },
      async appendEvent() {
        return 'stored';
      },
      async uploadArtifact() {
        return 'stored';
      },
    };
    const sandbox: RemoteWorkerSandbox = {
      async execute(input) {
        await new Promise<void>((resolveAbort) =>
          input.signal.addEventListener('abort', () => resolveAbort(), {
            once: true,
          })
        );
        return {
          status: 'cancelled',
          stdout: '',
          stderr: '',
          outputTruncated: false,
        };
      },
    };
    const agent = createRemoteWorkerAgent({
      workerId: 'worker-1',
      providerId: provider.id,
      client,
      sandbox,
      leaseDurationMs: 30,
      heartbeatIntervalMs: 5,
      defaultTimeoutMs: 1_000,
      defaultMaximumOutputBytes: 1_000,
    });
    await expect(agent.pollOnce()).resolves.toBe(true);
    expect(transitions).toEqual(['running']);
  });

  it('terminates work and publishes cancelled after an authenticated cancellation heartbeat', async () => {
    const transitions: string[] = [];
    const client: RemoteWorkerControlPlaneClient = {
      async claim() {
        return claim();
      },
      async renew() {
        return { lease: claim().lease, cancellationRequested: true };
      },
      async snapshot() {
        return snapshot;
      },
      async transition(input) {
        transitions.push(input.status);
        return true;
      },
      async appendEvent() {
        return 'stored';
      },
      async uploadArtifact() {
        return 'stored';
      },
    };
    const sandbox: RemoteWorkerSandbox = {
      async execute(input) {
        await new Promise<void>((resolveAbort) =>
          input.signal.addEventListener('abort', () => resolveAbort(), {
            once: true,
          })
        );
        return {
          status: 'cancelled',
          stdout: '',
          stderr: '',
          outputTruncated: false,
        };
      },
    };
    const agent = createRemoteWorkerAgent({
      workerId: 'worker-1',
      providerId: provider.id,
      client,
      sandbox,
      leaseDurationMs: 30,
      heartbeatIntervalMs: 5,
      defaultTimeoutMs: 1_000,
      defaultMaximumOutputBytes: 1_000,
    });
    await expect(agent.pollOnce()).resolves.toBe(true);
    expect(transitions).toEqual(['running', 'cancelled']);
  });

  it('fails deterministically when durable output budget is exhausted', async () => {
    const transitions: Array<{ status: string; reason?: string }> = [];
    const client: RemoteWorkerControlPlaneClient = {
      async claim() {
        return claim();
      },
      async renew() {
        return { lease: claim().lease, cancellationRequested: false };
      },
      async snapshot() {
        return snapshot;
      },
      async transition(input) {
        transitions.push({ status: input.status, reason: input.reason });
        return true;
      },
      async appendEvent() {
        return 'budget-exceeded';
      },
      async uploadArtifact() {
        return 'stored';
      },
    };
    const agent = createRemoteWorkerAgent({
      workerId: 'worker-1',
      providerId: provider.id,
      client,
      sandbox: {
        async execute() {
          return {
            status: 'succeeded',
            stdout: 'too much output',
            stderr: '',
            outputTruncated: false,
          };
        },
      },
      leaseDurationMs: 100,
      heartbeatIntervalMs: 20,
      defaultTimeoutMs: 1_000,
      defaultMaximumOutputBytes: 1_000,
    });
    await expect(agent.pollOnce()).resolves.toBe(true);
    expect(transitions).toEqual([
      { status: 'running', reason: undefined },
      { status: 'failed', reason: 'output-budget-exceeded' },
    ]);
  });

  it('fails deterministically when durable artifact budget is exhausted', async () => {
    const transitions: Array<{ status: string; reason?: string }> = [];
    const client: RemoteWorkerControlPlaneClient = {
      async claim() {
        return claim();
      },
      async renew() {
        return { lease: claim().lease, cancellationRequested: false };
      },
      async snapshot() {
        return snapshot;
      },
      async transition(input) {
        transitions.push({ status: input.status, reason: input.reason });
        return true;
      },
      async appendEvent() {
        return 'stored';
      },
      async uploadArtifact() {
        return 'budget-exceeded';
      },
    };
    const agent = createRemoteWorkerAgent({
      workerId: 'worker-1',
      providerId: provider.id,
      client,
      sandbox: {
        async execute() {
          return {
            status: 'succeeded',
            stdout: '',
            stderr: '',
            outputTruncated: false,
            artifacts: [
              {
                descriptor: {
                  artifactId: 'artifact-1',
                  kind: 'bundle',
                  mediaType: 'application/zip',
                  size: 1,
                  digest: `sha256-${'a'.repeat(64)}`,
                  expiresAt: 10_000,
                  authorizationScope: 'execution:execution-1',
                },
                contents: new Uint8Array([1]),
              },
            ],
          };
        },
      },
      leaseDurationMs: 100,
      heartbeatIntervalMs: 20,
      defaultTimeoutMs: 1_000,
      defaultMaximumOutputBytes: 1_000,
    });
    await expect(agent.pollOnce()).resolves.toBe(true);
    expect(transitions).toEqual([
      { status: 'running', reason: undefined },
      { status: 'failed', reason: 'artifact-budget-exceeded' },
    ]);
  });
});
