import { describe, expect, it, vi } from 'vitest';
import {
  assessRemoteExecutionRegionalRecovery,
  createRemoteExecutionRegionalRecoveryCoordinator,
  REMOTE_EXECUTION_REGIONAL_RECOVERY_FORMAT,
  REMOTE_EXECUTION_REGIONAL_RECOVERY_VERSION,
  type RemoteExecutionRegionalRecoveryCheckpoint,
  type RemoteExecutionRegionalTrafficAuthority,
} from './index';

const checkpoint = (
  regionId: string,
  overrides: Partial<RemoteExecutionRegionalRecoveryCheckpoint> = {}
): RemoteExecutionRegionalRecoveryCheckpoint =>
  Object.freeze({
    format: REMOTE_EXECUTION_REGIONAL_RECOVERY_FORMAT,
    version: REMOTE_EXECUTION_REGIONAL_RECOVERY_VERSION,
    regionId,
    executionId: 'execution-1',
    ownerId: 'owner-1',
    requestId: 'request-1',
    providerId: 'provider-1',
    snapshotId: 'snapshot-1',
    snapshotDigest: `sha256-${'1'.repeat(64)}`,
    status: 'running',
    latestCursor: 3,
    executionStateDigest: `sha256-${'5'.repeat(64)}`,
    stateDigest: `sha256-${'2'.repeat(64)}`,
    capturedAt: 2_000,
    lease: {
      workerId: 'worker-1',
      attempt: 1,
      acquiredAt: 1_000,
      expiresAt: 3_000,
    },
    ...overrides,
  });

describe('remote execution regional recovery', () => {
  it('distinguishes bounded lag from divergence and target-ahead split writers', () => {
    const source = checkpoint('region-a');
    expect(
      assessRemoteExecutionRegionalRecovery({
        source,
        now: 2_000,
        maximumWorkerAttempts: 3,
      })
    ).toMatchObject({
      kind: 'wait-for-replication',
      reason: 'target-missing',
    });
    expect(
      assessRemoteExecutionRegionalRecovery({
        source,
        target: checkpoint('region-b', { latestCursor: 2 }),
        now: 2_000,
        maximumWorkerAttempts: 3,
      })
    ).toMatchObject({
      kind: 'wait-for-replication',
      reason: 'execution-cursor-behind',
    });
    expect(
      assessRemoteExecutionRegionalRecovery({
        source,
        target: checkpoint('region-b', { latestCursor: 4 }),
        now: 2_000,
        maximumWorkerAttempts: 3,
      })
    ).toMatchObject({ kind: 'blocked', reason: 'target-ahead' });
    expect(
      assessRemoteExecutionRegionalRecovery({
        source,
        target: checkpoint('region-b', {
          stateDigest: `sha256-${'3'.repeat(64)}`,
        }),
        now: 2_000,
        maximumWorkerAttempts: 3,
      })
    ).toMatchObject({ kind: 'blocked', reason: 'state-diverged' });
  });

  it('preserves an exact live worker lease and never migrates an expired PTY', () => {
    const source = checkpoint('region-a', {
      terminal: {
        terminalSessionId: 'terminal-1',
        revision: 7,
        expiresAt: 3_000,
        sealedStateDigest: `sha256-${'4'.repeat(64)}`,
      },
    });
    const live = assessRemoteExecutionRegionalRecovery({
      source,
      target: checkpoint('region-b', {
        terminal: source.terminal,
      }),
      now: 2_999,
      maximumWorkerAttempts: 3,
    });
    expect(live).toMatchObject({
      kind: 'ready',
      mode: 'same-worker-continuation',
      terminalAction: 'preserve',
      nextWorkerAttempt: 1,
    });
    const expired = assessRemoteExecutionRegionalRecovery({
      source,
      target: checkpoint('region-b', {
        terminal: source.terminal,
      }),
      now: 3_000,
      maximumWorkerAttempts: 3,
    });
    expect(expired).toMatchObject({
      kind: 'ready',
      mode: 'worker-reclaim',
      terminalAction: 'close-transport-lost',
      nextWorkerAttempt: 2,
    });
  });

  it('projects queued, terminal and exhausted recovery without replaying work', () => {
    const queued = checkpoint('region-a', {
      status: 'queued',
      lease: undefined,
      latestCursor: 1,
    });
    expect(
      assessRemoteExecutionRegionalRecovery({
        source: queued,
        target: checkpoint('region-b', {
          status: 'queued',
          lease: undefined,
          latestCursor: 1,
        }),
        now: 2_000,
        maximumWorkerAttempts: 1,
      })
    ).toMatchObject({ kind: 'ready', mode: 'queued-claim' });
    const terminal = checkpoint('region-a', {
      status: 'succeeded',
      lease: undefined,
      latestCursor: 4,
    });
    expect(
      assessRemoteExecutionRegionalRecovery({
        source: terminal,
        target: checkpoint('region-b', {
          status: 'succeeded',
          lease: undefined,
          latestCursor: 4,
        }),
        now: 2_000,
        maximumWorkerAttempts: 1,
      })
    ).toMatchObject({ kind: 'terminal' });
    const exhausted = checkpoint('region-a', {
      lease: {
        workerId: 'worker-1',
        attempt: 3,
        acquiredAt: 1_000,
        expiresAt: 2_000,
      },
    });
    expect(
      assessRemoteExecutionRegionalRecovery({
        source: exhausted,
        target: checkpoint('region-b', { lease: exhausted.lease }),
        now: 2_000,
        maximumWorkerAttempts: 3,
      })
    ).toMatchObject({
      kind: 'ready',
      mode: 'worker-recovery-exhausted',
    });
  });

  it('runs assessment and Terminal revocation while traffic is exclusively drained', async () => {
    const source = checkpoint('region-a', {
      lease: {
        workerId: 'worker-1',
        attempt: 1,
        acquiredAt: 1_000,
        expiresAt: 2_000,
      },
      terminal: {
        terminalSessionId: 'terminal-1',
        revision: 2,
        expiresAt: 3_000,
        sealedStateDigest: `sha256-${'4'.repeat(64)}`,
      },
    });
    const target = checkpoint('region-b', {
      lease: source.lease,
      terminal: source.terminal,
    });
    const closeExecution = vi.fn(async () => 1);
    const sweepExpired = vi.fn(async () => 1);
    const authority: RemoteExecutionRegionalTrafficAuthority = Object.freeze({
      async initialize() {
        throw new Error('unused');
      },
      async inspect() {
        throw new Error('unused');
      },
      async listCutovers() {
        throw new Error('unused');
      },
      async acquire() {
        throw new Error('unused');
      },
      async cutover(input, prepare) {
        expect(input).toMatchObject({
          expectedEpoch: 1,
          sourceRegionId: 'region-a',
          targetRegionId: 'region-b',
        });
        const prepared = await prepare();
        expect(closeExecution).toHaveBeenCalledWith(
          'execution-1',
          'transport-lost'
        );
        return {
          kind: 'cutover' as const,
          state: {
            deploymentId: 'deployment-1',
            activeRegionId: 'region-b',
            epoch: 2,
            checkpointDigest: prepared.checkpointDigest,
            updatedAt: 2_000,
          },
          result: prepared.result,
        };
      },
    });
    const coordinator = createRemoteExecutionRegionalRecoveryCoordinator({
      deploymentId: 'deployment-1',
      sourceRegionId: 'region-a',
      targetRegionId: 'region-b',
      source: { capture: async () => source },
      target: {
        capture: vi
          .fn()
          .mockResolvedValueOnce(target)
          .mockResolvedValueOnce({ ...target, terminal: undefined }),
      },
      trafficAuthority: authority,
      maximumWorkerAttempts: 3,
      targetTerminalBroker: { closeExecution, sweepExpired },
    });
    const result = await coordinator.cutover({
      executionId: 'execution-1',
      expectedTrafficEpoch: 1,
      cutoverAt: 2_000,
    });
    expect(result).toMatchObject({
      kind: 'cutover',
      state: { activeRegionId: 'region-b', epoch: 2 },
      result: { kind: 'ready', mode: 'worker-reclaim' },
    });
    expect(sweepExpired).toHaveBeenCalledOnce();
  });

  it('does not advance traffic when the target is still behind', async () => {
    const source = checkpoint('region-a');
    let prepared = false;
    const authority: RemoteExecutionRegionalTrafficAuthority = {
      async initialize() {
        throw new Error('unused');
      },
      async inspect() {
        throw new Error('unused');
      },
      async listCutovers() {
        throw new Error('unused');
      },
      async acquire() {
        throw new Error('unused');
      },
      async cutover(_input, prepare) {
        prepared = true;
        await prepare();
        throw new Error('unreachable');
      },
    };
    const coordinator = createRemoteExecutionRegionalRecoveryCoordinator({
      deploymentId: 'deployment-1',
      sourceRegionId: 'region-a',
      targetRegionId: 'region-b',
      source: { capture: async () => source },
      target: {
        capture: async () => checkpoint('region-b', { latestCursor: 2 }),
      },
      trafficAuthority: authority,
      maximumWorkerAttempts: 3,
    });
    await expect(
      coordinator.cutover({
        executionId: 'execution-1',
        expectedTrafficEpoch: 1,
        cutoverAt: 2_000,
      })
    ).rejects.toMatchObject({ code: 'replication-lag' });
    expect(prepared).toBe(true);
  });

  it('rejects a probe that reports a different configured region', async () => {
    const source = checkpoint('region-wrong');
    const authority: RemoteExecutionRegionalTrafficAuthority = {
      async initialize() {
        throw new Error('unused');
      },
      async inspect() {
        throw new Error('unused');
      },
      async listCutovers() {
        throw new Error('unused');
      },
      async acquire() {
        throw new Error('unused');
      },
      async cutover(_input, prepare) {
        await prepare();
        throw new Error('unreachable');
      },
    };
    const coordinator = createRemoteExecutionRegionalRecoveryCoordinator({
      deploymentId: 'deployment-1',
      sourceRegionId: 'region-a',
      targetRegionId: 'region-b',
      source: { capture: async () => source },
      target: { capture: async () => checkpoint('region-b') },
      trafficAuthority: authority,
      maximumWorkerAttempts: 3,
    });
    await expect(
      coordinator.cutover({
        executionId: 'execution-1',
        expectedTrafficEpoch: 1,
        cutoverAt: 2_000,
      })
    ).rejects.toMatchObject({
      code: 'blocked',
      assessment: { kind: 'blocked', reason: 'identity-diverged' },
    });
  });
});
