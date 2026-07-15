import { describe, expect, it } from 'vitest';
import {
  EXECUTION_TEST_REPORT_TRACE_NAME,
  createExecutionRequest,
  type ExecutionJob,
  type ExecutionJobEvent,
} from '@prodivix/runtime-core';
import { createBrowserProjectSnapshot } from './browserProject';
import {
  BROWSER_PROJECT_TEST_EXECUTION_PROVIDER_ID,
  createBrowserProjectTestRunner,
} from './browserProjectTestRunner';
import { createBrowserProjectRuntimeHarness } from './__tests__/browserProjectRuntimeHarness';

const REPORT_PATH = '.prodivix/test-report.json';

const vitestReport = (failed = false): string =>
  JSON.stringify({
    startTime: 100,
    success: !failed,
    testResults: [
      {
        name: 'D:/runtime/src/App.test.tsx',
        status: failed ? 'failed' : 'passed',
        assertionResults: [
          {
            title: 'renders the app',
            fullName: 'generated application renders the app',
            status: failed ? 'failed' : 'passed',
            duration: 4,
            failureMessages: failed ? ['Expected true to be false.'] : [],
          },
        ],
        failureMessages: failed ? ['Expected true to be false.'] : [],
      },
    ],
  });

const snapshot = (snapshotId: string) =>
  createBrowserProjectSnapshot({
    workspaceId: 'workspace',
    snapshotId,
    files: [
      {
        path: 'package.json',
        contents: JSON.stringify({ scripts: { test: 'vitest run' } }),
      },
      {
        path: 'src/App.test.tsx',
        contents: `export const revision = '${snapshotId}';`,
        sourceTrace: [
          {
            sourceRef: {
              kind: 'code-artifact',
              artifactId: 'artifact-app-test',
            },
            sourceSpan: {
              artifactId: 'artifact-app-test',
              startLine: 1,
              startColumn: 1,
              endLine: 1,
              endColumn: 20,
            },
          },
        ],
      },
    ],
  });

const request = (snapshotId: string, timeoutMs?: number) =>
  createExecutionRequest({
    requestId: `request-${snapshotId}`,
    profile: 'test',
    runtimeZone: 'test',
    workspace: { workspaceId: 'workspace', snapshotId },
    invocation: {
      kind: 'test',
      targetRef: { kind: 'workspace', workspaceId: 'workspace' },
    },
    requiredCapabilities: [
      'artifacts',
      'diagnostics',
      'filesystem',
      'source-trace',
      'test',
    ],
    ...(timeoutMs === undefined ? {} : { timeoutMs }),
  });

const collectEvents = (job: ExecutionJob): ExecutionJobEvent[] => {
  const events: ExecutionJobEvent[] = [];
  job.subscribe((event) => events.push(event));
  return events;
};

const waitForStatus = (
  job: ExecutionJob,
  status: ReturnType<ExecutionJob['getSnapshot']>['status']
): Promise<void> =>
  new Promise((resolve) => {
    if (job.getSnapshot().status === status) {
      resolve();
      return;
    }
    const unsubscribe = job.subscribe((event) => {
      if (event.kind !== 'state' || event.snapshot.status !== status) return;
      unsubscribe();
      resolve();
    });
  });

describe('browser project test runner conformance', () => {
  it('publishes canonical reports and reuses installation across source revisions', async () => {
    const harness = createBrowserProjectRuntimeHarness();
    harness.queueCommand({
      exitCode: 0,
      output: '✓ src/App.test.tsx (1 test)\n',
      writeFiles: { [REPORT_PATH]: vitestReport() },
    });
    harness.queueCommand({
      exitCode: 0,
      writeFiles: { [REPORT_PATH]: vitestReport() },
    });
    const runner = createBrowserProjectTestRunner({
      createRuntime: harness.createRuntime,
      createJobId: (input) => `job-${input.requestId}`,
      createOwnerId: () => 'test-owner',
      now: () => 200,
      resolveProject: (input) => snapshot(input.workspace.snapshotId),
    });

    expect(runner.provider.descriptor).toMatchObject({
      id: BROWSER_PROJECT_TEST_EXECUTION_PROVIDER_ID,
      profiles: ['test'],
      runtimeZones: ['test'],
      invocationKinds: ['test'],
    });
    const first = await runner.provider.start(request('one'));
    const firstEvents = collectEvents(first);
    await expect(first.completion).resolves.toMatchObject({
      status: 'succeeded',
      exitCode: 0,
      output: {
        kind: 'test-report',
        status: 'passed',
        summary: { totalFiles: 1, totalCases: 1, passedCases: 1 },
      },
    });
    const second = await runner.provider.start(request('two'));
    await expect(second.completion).resolves.toMatchObject({
      status: 'succeeded',
    });

    expect(
      harness.commands.filter((command) => command.args?.includes('install'))
    ).toHaveLength(1);
    expect(firstEvents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: 'trace',
          trace: expect.objectContaining({
            name: EXECUTION_TEST_REPORT_TRACE_NAME,
            sourceTrace: [
              expect.objectContaining({
                sourceRef: {
                  kind: 'code-artifact',
                  artifactId: 'artifact-app-test',
                },
              }),
            ],
          }),
        }),
        expect.objectContaining({
          kind: 'artifact',
          artifact: expect.objectContaining({
            artifactId: 'test-report:job-request-one',
            kind: 'report',
            mediaType: 'application/vnd.prodivix.test-report+json',
          }),
        }),
      ])
    );
    await runner.dispose();
  });

  it('maps failed assertions to diagnostics and authoring source trace', async () => {
    const harness = createBrowserProjectRuntimeHarness();
    harness.queueCommand({
      exitCode: 1,
      writeFiles: { [REPORT_PATH]: vitestReport(true) },
    });
    const runner = createBrowserProjectTestRunner({
      createRuntime: harness.createRuntime,
      createJobId: () => 'job-failed',
      now: () => 200,
      resolveProject: () => snapshot('failed'),
    });
    const job = await runner.provider.start(request('failed'));
    const events = collectEvents(job);

    await expect(job.completion).resolves.toMatchObject({
      status: 'failed',
      exitCode: 1,
      failure: {
        code: 'BROWSER_PROJECT_TEST_FAILED',
        sourceTrace: [
          expect.objectContaining({
            sourceRef: {
              kind: 'code-artifact',
              artifactId: 'artifact-app-test',
            },
          }),
        ],
      },
    });
    expect(events).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: 'diagnostic',
          diagnostic: expect.objectContaining({
            code: 'TST-5001',
            targetRef: {
              kind: 'code-artifact',
              artifactId: 'artifact-app-test',
            },
          }),
        }),
      ])
    );
    await runner.dispose();
  });

  it('keeps nonzero process failure distinct from assertion failure', async () => {
    const harness = createBrowserProjectRuntimeHarness();
    harness.queueCommand({
      exitCode: 2,
      writeFiles: { [REPORT_PATH]: vitestReport() },
    });
    const runner = createBrowserProjectTestRunner({
      createRuntime: harness.createRuntime,
      now: () => 200,
      resolveProject: () => snapshot('process-failed'),
    });
    const job = await runner.provider.start(request('process-failed'));
    const events = collectEvents(job);

    await expect(job.completion).resolves.toMatchObject({
      status: 'failed',
      exitCode: 2,
      failure: { code: 'BROWSER_PROJECT_TEST_PROCESS_FAILED' },
    });
    const diagnosticCodes = events.flatMap((event) =>
      event.kind === 'diagnostic' ? [event.diagnostic.code] : []
    );
    expect(diagnosticCodes).toContain('TST-5002');
    expect(diagnosticCodes).not.toContain('TST-5001');
    await runner.dispose();
  });

  it('kills only the owned test process on cancellation and timeout', async () => {
    const cancelledHarness = createBrowserProjectRuntimeHarness();
    cancelledHarness.queueCommand({ pending: true });
    const cancelledRunner = createBrowserProjectTestRunner({
      createRuntime: cancelledHarness.createRuntime,
      resolveProject: () => snapshot('cancelled'),
    });
    const cancelledJob = await cancelledRunner.provider.start(
      request('cancelled')
    );
    await waitForStatus(cancelledJob, 'running');
    await cancelledJob.cancel({ reason: 'User stopped tests.' });
    await expect(cancelledJob.completion).resolves.toMatchObject({
      status: 'cancelled',
      reason: 'User stopped tests.',
    });
    expect(cancelledHarness.processes.at(-1)?.killed()).toBe(true);
    await cancelledRunner.dispose();

    const timeoutHarness = createBrowserProjectRuntimeHarness();
    timeoutHarness.queueCommand({ pending: true });
    const timeoutRunner = createBrowserProjectTestRunner({
      createRuntime: timeoutHarness.createRuntime,
      resolveProject: () => snapshot('timeout'),
    });
    const timedOutJob = await timeoutRunner.provider.start(
      request('timeout', 5)
    );
    await expect(timedOutJob.completion).resolves.toMatchObject({
      status: 'timed-out',
      timeoutMs: 5,
    });
    expect(timeoutHarness.processes.at(-1)?.killed()).toBe(true);
    await timeoutRunner.dispose();
  });
});
