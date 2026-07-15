import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { createExecutionJobController } from '../executionJob';
import {
  createExecutionProviderDescriptor,
  createExecutionRequest,
} from '../executionRequest';
import { createExecutionSessionCoordinator } from '../executionSession';

const descriptor = createExecutionProviderDescriptor({
  id: 'test.provider',
  version: '1',
  isolation: 'same-context',
  profiles: ['preview'],
  runtimeZones: ['client'],
  invocationKinds: ['workspace'],
  capabilities: ['streaming-logs'],
});

const createController = (jobId: string) =>
  createExecutionJobController({
    jobId,
    provider: descriptor,
    request: createExecutionRequest({
      requestId: `request-${jobId}`,
      profile: 'preview',
      runtimeZone: 'client',
      workspace: { workspaceId: 'workspace', snapshotId: jobId },
      invocation: {
        kind: 'workspace',
        targetRef: { kind: 'workspace', workspaceId: 'workspace' },
      },
      requiredCapabilities: ['streaming-logs'],
    }),
  });

describe('execution session properties', () => {
  it('retains the bounded event tail while the active job advances across revisions', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 25 }),
        fc.array(fc.string(), { maxLength: 60 }),
        fc.array(fc.string(), { maxLength: 60 }),
        (maxEvents, firstMessages, secondMessages) => {
          const coordinator = createExecutionSessionCoordinator({ maxEvents });
          const expectedEventKeys: string[] = [];
          const runJob = (jobId: string, messages: readonly string[]) => {
            const controller = createController(jobId);
            const unsubscribe = controller.job.subscribe((event) => {
              expectedEventKeys.push(
                `${jobId}:${event.sequence}:${event.kind}`
              );
            });
            coordinator.activate({
              sessionId: 'preview',
              label: 'Preview',
              job: controller.job,
            });
            controller.markStarting();
            controller.markRunning();
            messages.forEach((message) =>
              controller.emitLog({
                stream: 'stdout',
                level: 'info',
                message,
              })
            );
            unsubscribe();
            return controller;
          };

          runJob('job-first', firstMessages);
          const activeController = runJob('job-second', secondMessages);

          const snapshot = coordinator.getSnapshot('preview');
          expect(
            snapshot?.events.map(
              (record) =>
                `${record.jobId}:${record.event.sequence}:${record.event.kind}`
            )
          ).toEqual(expectedEventKeys.slice(-maxEvents));
          expect(snapshot?.activeJob?.jobId).toBe('job-second');
          expect(snapshot?.events.at(-1)?.event.sequence).toBe(
            activeController.job.getSnapshot().latestEventSequence
          );
          expect(snapshot?.status).toBe('running');
        }
      )
    );
  });
});
