import { describe, expect, it, vi } from 'vitest';
import {
  RemoteExecutionClientError,
  RemoteExecutionRecoveryRequiredError,
} from './remoteExecutionClient';
import {
  createRemoteExecutionRecoveryPlan,
  reconnectRemoteExecution,
  recoverRemoteExecutionArtifact,
} from './remoteExecutionRecovery';
import { remotePreviewExecutionProviderDescriptor } from './remoteExecutionProvider';
import type {
  RemoteExecutionArtifactDescriptor,
  RemoteExecutionRecord,
} from './remoteExecutionProtocol.types';

const execution: RemoteExecutionRecord = Object.freeze({
  executionId: 'execution-1',
  requestId: 'request-1',
  snapshotDigest: `sha256-${'a'.repeat(64)}`,
  provider: remotePreviewExecutionProviderDescriptor,
  status: 'running',
  latestCursor: 3,
  createdAt: 1_000,
  startedAt: 1_001,
});

const expected = Object.freeze({
  executionId: execution.executionId,
  requestId: execution.requestId,
  snapshotDigest: execution.snapshotDigest,
  providerId: execution.provider.id,
});

const event = (sequence: number) => ({
  cursor: sequence,
  event: {
    kind: 'log' as const,
    jobId: execution.executionId,
    sequence,
    emittedAt: 1_000 + sequence,
    log: {
      stream: 'stdout' as const,
      level: 'info' as const,
      message: `${sequence}`,
    },
  },
});

const artifact: RemoteExecutionArtifactDescriptor = Object.freeze({
  artifactId: 'artifact-1',
  kind: 'bundle',
  mediaType: 'application/zip',
  size: 10,
  digest: `sha256-${'b'.repeat(64)}`,
  expiresAt: 2_000,
  authorizationScope: 'execution:execution-1',
});

describe('remote execution recovery', () => {
  it('reconnects the same immutable execution from a contiguous durable cursor', async () => {
    const client = {
      get: vi.fn(async () => execution),
      readEvents: vi.fn(async ({ afterCursor }: { afterCursor: number }) => ({
        executionId: execution.executionId,
        providerId: execution.provider.id,
        afterCursor,
        latestCursor: 3,
        hasMore: false,
        events: [event(2), event(3)],
      })),
    };

    await expect(
      reconnectRemoteExecution({
        client,
        expected,
        afterCursor: 1,
      })
    ).resolves.toMatchObject({
      afterCursor: 1,
      nextCursor: 3,
      caughtUp: true,
      events: [{ cursor: 2 }, { cursor: 3 }],
    });
    expect(client.get).toHaveBeenCalledTimes(2);
  });

  it('fails closed on execution identity or cursor drift', async () => {
    await expect(
      reconnectRemoteExecution({
        client: {
          get: async () => ({ ...execution, requestId: 'drifted' }),
          readEvents: async () => {
            throw new Error('must not read');
          },
        },
        expected,
        afterCursor: 1,
      })
    ).rejects.toBeInstanceOf(RemoteExecutionRecoveryRequiredError);

    await expect(
      reconnectRemoteExecution({
        client: {
          get: async () => execution,
          readEvents: async ({ afterCursor }) => ({
            executionId: execution.executionId,
            providerId: execution.provider.id,
            afterCursor,
            latestCursor: 3,
            hasMore: false,
            events: [event(3)],
          }),
        },
        expected,
        afterCursor: 1,
      })
    ).rejects.toBeInstanceOf(RemoteExecutionRecoveryRequiredError);
  });

  it('reuses an unexpired artifact and requires a new request after expiry or loss', async () => {
    const resolveArtifact = vi.fn(async () => ({
      executionId: execution.executionId,
      providerId: execution.provider.id,
      artifact,
    }));
    await expect(
      recoverRemoteExecutionArtifact({
        client: { resolveArtifact },
        executionId: execution.executionId,
        artifactId: artifact.artifactId,
        knownDescriptor: artifact,
        now: () => 1_500,
      })
    ).resolves.toEqual({ status: 'available', artifact });

    await expect(
      recoverRemoteExecutionArtifact({
        client: { resolveArtifact },
        executionId: execution.executionId,
        artifactId: artifact.artifactId,
        knownDescriptor: artifact,
        now: () => 2_000,
      })
    ).resolves.toMatchObject({
      status: 'new-request',
      reason: 'artifact-expired',
      replayMutations: false,
    });
    expect(resolveArtifact).toHaveBeenCalledTimes(1);

    await expect(
      recoverRemoteExecutionArtifact({
        client: {
          resolveArtifact: async () => {
            throw new RemoteExecutionClientError(
              { code: 'not-found', message: 'missing', retryable: false },
              'artifact.resolve'
            );
          },
        },
        executionId: execution.executionId,
        artifactId: artifact.artifactId,
        now: () => 1_500,
      })
    ).resolves.toMatchObject({
      status: 'new-request',
      reason: 'artifact-missing',
      automatic: false,
    });
  });

  it('separates reconnect, quota, and exhausted-worker recovery policies', () => {
    expect(
      createRemoteExecutionRecoveryPlan({
        error: new RemoteExecutionClientError(
          { code: 'unavailable', message: 'offline', retryable: true },
          'events.read'
        ),
        afterCursor: 7,
      })
    ).toEqual({
      status: 'reconnect',
      reason: 'transport-unavailable',
      executionStrategy: 'same-execution',
      afterCursor: 7,
      automatic: true,
      preserveEvents: true,
      replayMutations: false,
    });
    expect(
      createRemoteExecutionRecoveryPlan({
        error: new RemoteExecutionClientError(
          { code: 'quota-exceeded', message: 'full', retryable: false },
          'create'
        ),
      })
    ).toMatchObject({
      status: 'wait-for-capacity',
      requestStrategy: 'new-request',
      automatic: false,
    });
    expect(
      createRemoteExecutionRecoveryPlan({
        terminalReason: 'worker-recovery-exhausted',
      })
    ).toMatchObject({
      status: 'new-request',
      reason: 'worker-recovery-exhausted',
      replayMutations: false,
    });
  });

  it('requires explicit access or policy repair without replaying effects', () => {
    expect(
      createRemoteExecutionRecoveryPlan({
        error: new RemoteExecutionClientError(
          { code: 'unauthorized', message: 'expired', retryable: false },
          'events.read'
        ),
        afterCursor: 9,
      })
    ).toEqual({
      status: 'restore-authorization',
      reason: 'authorization-required',
      resumeStrategy: 'same-execution',
      afterCursor: 9,
      automatic: false,
      preserveEvents: true,
      replayMutations: false,
    });
    expect(
      createRemoteExecutionRecoveryPlan({
        error: new RemoteExecutionClientError(
          { code: 'forbidden', message: 'denied', retryable: false },
          'get'
        ),
        operation: 'get',
      })
    ).toMatchObject({
      status: 'blocked',
      reason: 'permission-denied',
      automatic: false,
    });
    expect(
      createRemoteExecutionRecoveryPlan({
        terminalReason: 'network-policy-denied',
      })
    ).toMatchObject({
      status: 'blocked',
      reason: 'network-policy-denied',
      replayMutations: false,
    });
    expect(
      createRemoteExecutionRecoveryPlan({
        terminalReason: 'secret-resolution-denied',
      })
    ).toMatchObject({
      status: 'blocked',
      reason: 'permission-denied',
    });
  });

  it('distinguishes request retry identity from terminal new-request recovery', () => {
    expect(
      createRemoteExecutionRecoveryPlan({
        error: new RemoteExecutionClientError(
          {
            code: 'timeout',
            message: 'unknown create result',
            retryable: true,
          },
          'create'
        ),
      })
    ).toEqual({
      status: 'retry-request',
      reason: 'request-timeout',
      requestStrategy: 'same-request-identity',
      automatic: false,
      preserveEvents: true,
      replayMutations: false,
    });
    expect(
      createRemoteExecutionRecoveryPlan({ terminalStatus: 'cancelled' })
    ).toMatchObject({
      status: 'new-request',
      reason: 'execution-cancelled',
      replayMutations: false,
    });
    expect(
      createRemoteExecutionRecoveryPlan({ terminalStatus: 'timed-out' })
    ).toMatchObject({
      status: 'new-request',
      reason: 'execution-timed-out',
      replayMutations: false,
    });
  });
});
