import { describe, expect, it } from 'vitest';
import {
  createExecutionJobController,
  createExecutionProviderDescriptor,
  createExecutionRequest,
  createExecutionSessionCoordinator,
  type ExecutionSessionStatus,
} from '..';

const descriptor = createExecutionProviderDescriptor({
  id: 'session-conformance',
  version: '1',
  isolation: 'same-context',
  profiles: ['test'],
  runtimeZones: ['test'],
  invocationKinds: ['test'],
});

describe('execution session', () => {
  it('retains completed job history without replaying historical statuses', () => {
    let timestamp = 0;
    const controller = createExecutionJobController({
      jobId: 'completed-job',
      provider: descriptor,
      request: createExecutionRequest({
        requestId: 'completed-request',
        profile: 'test',
        runtimeZone: 'test',
        workspace: {
          workspaceId: 'workspace',
          snapshotId: 'snapshot',
        },
        invocation: {
          kind: 'test',
          targetRef: { kind: 'workspace', workspaceId: 'workspace' },
        },
      }),
      now: () => ++timestamp,
    });
    controller.markStarting();
    controller.markRunning();
    controller.succeed();

    const coordinator = createExecutionSessionCoordinator();
    const observedStatuses: ExecutionSessionStatus[] = [];
    coordinator.subscribe((_sessionId, snapshot) => {
      if (snapshot) observedStatuses.push(snapshot.status);
    });

    const snapshot = coordinator.activate({
      sessionId: 'completed-session',
      job: controller.job,
    });

    expect(observedStatuses).toEqual(
      Array.from({ length: 5 }, () => 'succeeded')
    );
    expect(snapshot.status).toBe('succeeded');
    expect(snapshot.events.map(({ event }) => event.kind)).toEqual([
      'state',
      'state',
      'state',
      'state',
    ]);
    expect(snapshot.updatedAt).toBe(controller.job.getSnapshot().completedAt);
  });
});
