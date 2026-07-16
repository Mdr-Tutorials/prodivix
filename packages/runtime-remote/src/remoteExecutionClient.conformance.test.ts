import { describe, expect, it } from 'vitest';
import {
  createRemoteExecutionClient,
  RemoteExecutionClientError,
  RemoteExecutionRecoveryRequiredError,
} from './remoteExecutionClient';
import { InMemoryRemoteExecutionControlPlane } from './__tests__/inMemoryRemoteExecutionControlPlane';
import {
  createRemoteFixtureRequest,
  createRemoteFixtureSnapshot,
} from './__tests__/remoteExecutionFixtures';

const createHarness = () => {
  const controlPlane = new InMemoryRemoteExecutionControlPlane();
  const delays: number[] = [];
  const client = createRemoteExecutionClient({
    transport: controlPlane,
    retryPolicy: {
      maxAttempts: 3,
      initialDelayMs: 10,
      maxDelayMs: 20,
      jitterRatio: 0,
    },
    delay: async (milliseconds) => {
      delays.push(milliseconds);
    },
    random: () => 0.5,
  });
  return { client, controlPlane, delays };
};

describe('remote execution client conformance', () => {
  it('negotiates once and strongly idempotently creates after a lost response', async () => {
    const { client, controlPlane, delays } = createHarness();
    const request = createRemoteFixtureRequest();
    const snapshot = createRemoteFixtureSnapshot();
    await client.negotiate();
    controlPlane.injectLostResponse();

    const first = await client.create({
      request,
      snapshot: { kind: 'upload', snapshot },
    });
    const duplicate = await client.create({
      request,
      snapshot: { kind: 'upload', snapshot },
    });

    expect(duplicate.execution.executionId).toBe(first.execution.executionId);
    expect(controlPlane.createMutationCount).toBe(1);
    expect(delays).toEqual([10]);
    expect(
      controlPlane.requests.filter(
        (entry) => entry.request.operation === 'negotiate'
      )
    ).toHaveLength(1);
  });

  it('fails closed when one request id is reused with another digest', async () => {
    const { client, controlPlane } = createHarness();
    const request = createRemoteFixtureRequest();
    await client.create({
      request,
      snapshot: { kind: 'upload', snapshot: createRemoteFixtureSnapshot() },
    });
    const independentClient = createRemoteExecutionClient({
      transport: controlPlane,
      delay: async () => undefined,
      retryPolicy: { maxAttempts: 1 },
    });
    await expect(
      independentClient.create({
        request,
        snapshot: {
          kind: 'upload',
          snapshot: createRemoteFixtureSnapshot('export const value = 2;'),
        },
      })
    ).rejects.toMatchObject({
      name: 'RemoteExecutionClientError',
      remoteCode: 'identity-conflict',
      retryable: false,
    });
    expect(controlPlane.createMutationCount).toBe(1);
  });

  it('replays from a confirmed cursor and bounds retry across disconnects', async () => {
    const { client, controlPlane, delays } = createHarness();
    const created = await client.create({
      request: createRemoteFixtureRequest(),
      snapshot: { kind: 'upload', snapshot: createRemoteFixtureSnapshot() },
    });
    controlPlane.failTransportAttempts(2);
    const events = await client.readEvents({
      executionId: created.execution.executionId,
      afterCursor: 0,
    });
    expect(events.events.map((event) => event.cursor)).toEqual([1, 2]);
    expect(delays).toEqual([10, 20]);

    const replay = await client.readEvents({
      executionId: created.execution.executionId,
      afterCursor: 1,
    });
    expect(replay.events.map((event) => event.cursor)).toEqual([2]);
  });

  it('rejects cursor gaps and provider identity drift instead of guessing', async () => {
    const { client, controlPlane } = createHarness();
    const created = await client.create({
      request: createRemoteFixtureRequest(),
      snapshot: { kind: 'upload', snapshot: createRemoteFixtureSnapshot() },
    });
    controlPlane.injectEventGap();
    await expect(
      client.readEvents({
        executionId: created.execution.executionId,
        afterCursor: 0,
      })
    ).rejects.toBeInstanceOf(RemoteExecutionRecoveryRequiredError);

    controlPlane.injectOutOfOrderEvents();
    await expect(
      client.readEvents({
        executionId: created.execution.executionId,
        afterCursor: 0,
      })
    ).rejects.toBeInstanceOf(RemoteExecutionRecoveryRequiredError);

    controlPlane.injectProviderDrift();
    await expect(
      client.get(created.execution.executionId)
    ).rejects.toBeInstanceOf(RemoteExecutionRecoveryRequiredError);
  });

  it('deduplicates cancel and never creates another terminal transition', async () => {
    const { client, controlPlane } = createHarness();
    const created = await client.create({
      request: createRemoteFixtureRequest(),
      snapshot: { kind: 'upload', snapshot: createRemoteFixtureSnapshot() },
    });
    const input = {
      executionId: created.execution.executionId,
      cancellationId: 'cancel-1',
      reason: 'user',
    };
    const first = await client.cancel(input);
    const duplicate = await client.cancel(input);
    expect(first).toEqual(duplicate);
    expect(first.result.status).toBe('accepted');
    expect(controlPlane.cancelMutationCount).toBe(1);
    expect((await client.get(input.executionId)).status).toBe('cancelled');
    controlPlane.injectStatusRegression();
    await expect(client.get(input.executionId)).rejects.toBeInstanceOf(
      RemoteExecutionRecoveryRequiredError
    );
  });

  it('resolves opaque artifact metadata without a provider URL', async () => {
    const { client } = createHarness();
    const created = await client.create({
      request: createRemoteFixtureRequest(),
      snapshot: { kind: 'upload', snapshot: createRemoteFixtureSnapshot() },
    });
    const result = await client.resolveArtifact({
      executionId: created.execution.executionId,
      artifactId: 'artifact-preview',
    });
    expect(result.artifact).toMatchObject({
      artifactId: 'artifact-preview',
      digest: expect.stringMatching(/^sha256-/u),
      mediaType: 'application/zip',
      size: 128,
    });
    expect(result.artifact).not.toHaveProperty('uri');
  });

  it('maps provider failures to stable sanitized diagnostics', async () => {
    const { client, controlPlane } = createHarness();
    controlPlane.injectInternalError();
    const error = await client.get('execution-missing').catch((cause) => cause);
    expect(error).toBeInstanceOf(RemoteExecutionClientError);
    expect(error).toMatchObject({
      remoteCode: 'internal',
      diagnostic: {
        code: 'EXE-5003',
        retryable: false,
      },
    });
    expect(JSON.stringify(error.diagnostic)).not.toMatch(
      /secret|stack|credential/u
    );
  });

  it('retries stable retryable errors without changing the message identity', async () => {
    const { client, controlPlane, delays } = createHarness();
    controlPlane.failRetryableAttempts(2);
    await expect(client.negotiate()).resolves.toBe(1);
    expect(delays).toEqual([10, 20]);
    const negotiations = controlPlane.requests.filter(
      (entry) => entry.request.operation === 'negotiate'
    );
    expect(new Set(negotiations.map((entry) => entry.messageId)).size).toBe(1);
  });
});
