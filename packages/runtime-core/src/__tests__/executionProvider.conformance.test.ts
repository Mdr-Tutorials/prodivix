import { describe, expect, it } from 'vitest';
import {
  createExecutionJobController,
  createExecutionProviderDescriptor,
  createExecutionProviderRegistry,
  createExecutionRequest,
  ExecutionProviderContractError,
  type ExecutionJobEvent,
  type ExecutionProvider,
} from '..';

describe('execution provider conformance', () => {
  it('preserves request identity and complete observable output through the registry', async () => {
    const descriptor = createExecutionProviderDescriptor({
      id: 'inline-conformance',
      version: '1',
      isolation: 'same-context',
      profiles: ['test'],
      runtimeZones: ['test'],
      invocationKinds: ['test'],
      capabilities: [
        'streaming-logs',
        'diagnostics',
        'artifacts',
        'source-trace',
      ],
    });
    const provider: ExecutionProvider = {
      descriptor,
      start: async (request) => {
        const controller = createExecutionJobController({
          jobId: `job:${request.requestId}`,
          request,
          provider: descriptor,
        });
        controller.markStarting();
        controller.markRunning();
        controller.emitLog({
          stream: 'stdout',
          level: 'info',
          message: 'running tests',
        });
        controller.emitDiagnostic({
          code: 'TEST-0001',
          severity: 'info',
          domain: 'code',
          message: 'conformance diagnostic',
        });
        controller.emitArtifact({
          artifactId: 'report-1',
          kind: 'report',
          mediaType: 'application/json',
          uri: 'memory://report-1',
        });
        controller.emitTrace({
          traceId: 'trace-1',
          spanId: 'span-1',
          name: 'test run',
          phase: 'end',
          sourceTrace: [
            {
              sourceRef: {
                kind: 'code-artifact',
                artifactId: 'test-artifact',
              },
            },
          ],
        });
        controller.succeed({ output: { passed: true } });
        return controller.job;
      },
    };
    const request = createExecutionRequest({
      requestId: 'request-1',
      profile: 'test',
      runtimeZone: 'test',
      workspace: {
        workspaceId: 'workspace-1',
        snapshotId: 'snapshot-1',
      },
      invocation: {
        kind: 'test',
        targetRef: { kind: 'workspace', workspaceId: 'workspace-1' },
      },
      requiredCapabilities: descriptor.capabilities,
    });
    const registry = createExecutionProviderRegistry();
    registry.register(provider);

    const job = await registry.start(descriptor.id, request);
    const events: ExecutionJobEvent[] = [];
    job.subscribe((event) => events.push(event));
    const result = await job.completion;

    expect(job.request).toBe(request);
    expect(events.map((event) => event.kind)).toEqual([
      'state',
      'state',
      'state',
      'log',
      'diagnostic',
      'artifact',
      'trace',
      'state',
    ]);
    expect(result).toMatchObject({
      status: 'succeeded',
      requestId: request.requestId,
      providerId: descriptor.id,
      output: { passed: true },
    });
    expect(result.diagnostics).toHaveLength(1);
    expect(result.artifacts).toHaveLength(1);
  });

  it('rejects a job that replaces the canonical request object', async () => {
    const descriptor = createExecutionProviderDescriptor({
      id: 'request-identity-conformance',
      version: '1',
      isolation: 'same-context',
      profiles: ['test'],
      runtimeZones: ['test'],
      invocationKinds: ['test'],
    });
    const request = createExecutionRequest({
      requestId: 'request-identity',
      profile: 'test',
      runtimeZone: 'test',
      workspace: {
        workspaceId: 'workspace-1',
        snapshotId: 'snapshot-1',
      },
      invocation: {
        kind: 'test',
        targetRef: { kind: 'workspace', workspaceId: 'workspace-1' },
      },
    });
    const controller = createExecutionJobController({
      jobId: 'replaced-request-job',
      request: Object.freeze({ ...request }),
      provider: descriptor,
    });
    let cancelCalls = 0;
    const job = {
      ...controller.job,
      cancel: async () => {
        cancelCalls += 1;
        return Object.freeze({ status: 'accepted' as const });
      },
    };
    const provider: ExecutionProvider = {
      descriptor,
      start: async () => job,
    };
    const registry = createExecutionProviderRegistry();
    registry.register(provider);

    await expect(registry.start(descriptor.id, request)).rejects.toThrow(
      ExecutionProviderContractError
    );
    expect(cancelCalls).toBe(1);
  });
});
