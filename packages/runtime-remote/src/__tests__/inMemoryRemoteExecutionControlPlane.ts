import type {
  ExecutionCancellationResult,
  ExecutionJobEvent,
} from '@prodivix/runtime-core';
import {
  createRemoteExecutionFailureEnvelope,
  createRemoteExecutionSuccessEnvelope,
  decodeRemoteExecutionRequestEnvelope,
  type DecodedRemoteExecutionRequestEnvelope,
} from '../remoteExecutionProtocolCodec';
import type {
  RemoteExecutionArtifactDescriptor,
  RemoteExecutionCancelResult,
  RemoteExecutionRecord,
  RemoteExecutionResponseEnvelope,
  RemoteExecutionSnapshotSource,
  RemoteExecutionTransport,
  RemoteExecutionWireError,
} from '../remoteExecutionProtocol.types';
import { remoteFixtureProvider } from './remoteExecutionFixtures';

type StoredExecution = {
  identity: string;
  record: RemoteExecutionRecord;
  events: ExecutionJobEvent[];
  artifact: RemoteExecutionArtifactDescriptor;
};

const digestOf = (source: RemoteExecutionSnapshotSource): string =>
  source.kind === 'reference'
    ? source.contentDigest
    : source.snapshot.contentDigest;

const failure = (
  request: DecodedRemoteExecutionRequestEnvelope,
  code: RemoteExecutionWireError['code'],
  retryable = false,
  message = 'Remote request failed.'
) =>
  createRemoteExecutionFailureEnvelope(request, {
    code,
    message,
    retryable,
  });

export class InMemoryRemoteExecutionControlPlane implements RemoteExecutionTransport {
  readonly requests: DecodedRemoteExecutionRequestEnvelope[] = [];
  createMutationCount = 0;
  cancelMutationCount = 0;
  private transportFailuresRemaining = 0;
  private retryableFailuresRemaining = 0;
  private gapNextEvents = false;
  private reorderNextEvents = false;
  private providerDriftNext = false;
  private statusRegressionNext = false;
  private internalErrorNext = false;
  private loseResponseAfterHandle = false;
  private executionSequence = 0;
  private readonly executionsById = new Map<string, StoredExecution>();
  private readonly executionIdByRequest = new Map<string, string>();
  private readonly cancellationResults = new Map<
    string,
    RemoteExecutionCancelResult
  >();

  failTransportAttempts(count: number): void {
    this.transportFailuresRemaining = count;
  }

  failRetryableAttempts(count: number): void {
    this.retryableFailuresRemaining = count;
  }

  injectEventGap(): void {
    this.gapNextEvents = true;
  }

  injectOutOfOrderEvents(): void {
    this.reorderNextEvents = true;
  }

  injectProviderDrift(): void {
    this.providerDriftNext = true;
  }

  injectStatusRegression(): void {
    this.statusRegressionNext = true;
  }

  injectInternalError(): void {
    this.internalErrorNext = true;
  }

  injectLostResponse(): void {
    this.loseResponseAfterHandle = true;
  }

  async send(envelope: Parameters<RemoteExecutionTransport['send']>[0]) {
    if (this.transportFailuresRemaining > 0) {
      this.transportFailuresRemaining -= 1;
      throw new Error('simulated disconnect');
    }
    const request = decodeRemoteExecutionRequestEnvelope(envelope);
    this.requests.push(request);
    if (this.retryableFailuresRemaining > 0) {
      this.retryableFailuresRemaining -= 1;
      return failure(request, 'unavailable', true);
    }
    if (this.internalErrorNext) {
      this.internalErrorNext = false;
      return failure(
        request,
        'internal',
        false,
        'credential=secret\nstack: private worker path'
      );
    }
    const response = this.handle(request);
    if (this.loseResponseAfterHandle) {
      this.loseResponseAfterHandle = false;
      throw new Error('simulated lost response');
    }
    return response;
  }

  private handle(
    request: DecodedRemoteExecutionRequestEnvelope
  ): RemoteExecutionResponseEnvelope {
    switch (request.request.operation) {
      case 'negotiate': {
        const selectedVersion = request.request.payload.supportedVersions.find(
          (version) => version === 1
        );
        return selectedVersion
          ? createRemoteExecutionSuccessEnvelope(request, { selectedVersion })
          : failure(request, 'protocol-version-unsupported');
      }
      case 'create':
        return this.create(request, request.request);
      case 'get': {
        const stored = this.executionsById.get(
          request.request.payload.executionId
        );
        if (!stored) return failure(request, 'not-found');
        if (this.providerDriftNext) {
          this.providerDriftNext = false;
          return createRemoteExecutionSuccessEnvelope(request, {
            ...stored.record,
            provider: { ...stored.record.provider, id: 'drifted-provider' },
          });
        }
        if (this.statusRegressionNext) {
          this.statusRegressionNext = false;
          return createRemoteExecutionSuccessEnvelope(request, {
            ...stored.record,
            status: 'running',
            completedAt: undefined,
          });
        }
        return createRemoteExecutionSuccessEnvelope(request, stored.record);
      }
      case 'cancel':
        return this.cancel(request, request.request);
      case 'events.read':
        return this.readEvents(request, request.request);
      case 'artifact.resolve': {
        const stored = this.executionsById.get(
          request.request.payload.executionId
        );
        if (!stored) return failure(request, 'not-found');
        if (stored.artifact.artifactId !== request.request.payload.artifactId) {
          return failure(request, 'not-found');
        }
        return createRemoteExecutionSuccessEnvelope(request, {
          executionId: stored.record.executionId,
          providerId: stored.record.provider.id,
          artifact: stored.artifact,
        });
      }
    }
  }

  private create(
    request: DecodedRemoteExecutionRequestEnvelope,
    createRequest: Extract<
      DecodedRemoteExecutionRequestEnvelope['request'],
      { operation: 'create' }
    >
  ): RemoteExecutionResponseEnvelope {
    const { request: executionRequest, snapshot } = createRequest.payload;
    const digest = digestOf(snapshot);
    const identity = JSON.stringify({ executionRequest, digest });
    const existingId = this.executionIdByRequest.get(
      executionRequest.requestId
    );
    if (existingId) {
      const existing = this.executionsById.get(existingId)!;
      return existing.identity === identity
        ? createRemoteExecutionSuccessEnvelope(request, {
            execution: existing.record,
          })
        : failure(request, 'identity-conflict');
    }
    this.executionSequence += 1;
    this.createMutationCount += 1;
    const executionId = `execution-${this.executionSequence}`;
    const createdAt = 1_000 + this.executionSequence;
    const queuedSnapshot = {
      jobId: executionId,
      requestId: executionRequest.requestId,
      providerId: remoteFixtureProvider.id,
      status: 'queued' as const,
      latestEventSequence: 1,
      createdAt,
    };
    const runningSnapshot = {
      ...queuedSnapshot,
      status: 'running' as const,
      latestEventSequence: 2,
      startedAt: createdAt + 1,
    };
    const events: ExecutionJobEvent[] = [
      {
        kind: 'state',
        jobId: executionId,
        sequence: 1,
        emittedAt: createdAt,
        snapshot: queuedSnapshot,
      },
      {
        kind: 'state',
        jobId: executionId,
        sequence: 2,
        emittedAt: createdAt + 1,
        previousStatus: 'queued',
        snapshot: runningSnapshot,
      },
    ];
    const record: RemoteExecutionRecord = Object.freeze({
      executionId,
      requestId: executionRequest.requestId,
      snapshotDigest: digest,
      provider: remoteFixtureProvider,
      status: 'running',
      latestCursor: events.length,
      createdAt,
      startedAt: createdAt + 1,
    });
    const stored: StoredExecution = {
      identity,
      record,
      events,
      artifact: Object.freeze({
        artifactId: 'artifact-preview',
        kind: 'bundle',
        label: 'Preview bundle',
        mediaType: 'application/zip',
        size: 128,
        digest: `sha256-${'a'.repeat(64)}`,
        expiresAt: createdAt + 60_000,
        authorizationScope: `execution:${executionId}`,
      }),
    };
    this.executionsById.set(executionId, stored);
    this.executionIdByRequest.set(executionRequest.requestId, executionId);
    return createRemoteExecutionSuccessEnvelope(request, { execution: record });
  }

  private cancel(
    request: DecodedRemoteExecutionRequestEnvelope,
    cancelRequest: Extract<
      DecodedRemoteExecutionRequestEnvelope['request'],
      { operation: 'cancel' }
    >
  ): RemoteExecutionResponseEnvelope {
    const { executionId, cancellationId } = cancelRequest.payload;
    const stored = this.executionsById.get(executionId);
    if (!stored) return failure(request, 'not-found');
    const key = `${executionId}:${cancellationId}`;
    const previous = this.cancellationResults.get(key);
    if (previous)
      return createRemoteExecutionSuccessEnvelope(request, previous);
    const terminal = ['succeeded', 'failed', 'cancelled', 'timed-out'].includes(
      stored.record.status
    );
    const result: ExecutionCancellationResult = Object.freeze({
      status: terminal ? 'already-terminal' : 'accepted',
    });
    const response: RemoteExecutionCancelResult = Object.freeze({
      executionId,
      cancellationId,
      result,
    });
    this.cancellationResults.set(key, response);
    if (!terminal) {
      this.cancelMutationCount += 1;
      const completedAt = stored.record.createdAt + 10;
      const sequence = stored.events.length + 1;
      stored.events.push({
        kind: 'state',
        jobId: executionId,
        sequence,
        emittedAt: completedAt,
        previousStatus: stored.record.status,
        snapshot: {
          jobId: executionId,
          requestId: stored.record.requestId,
          providerId: stored.record.provider.id,
          status: 'cancelled',
          latestEventSequence: sequence,
          createdAt: stored.record.createdAt,
          ...(stored.record.startedAt
            ? { startedAt: stored.record.startedAt }
            : {}),
          completedAt,
        },
      });
      stored.record = Object.freeze({
        ...stored.record,
        status: 'cancelled',
        latestCursor: stored.events.length,
        completedAt,
      });
    }
    return createRemoteExecutionSuccessEnvelope(request, response);
  }

  private readEvents(
    request: DecodedRemoteExecutionRequestEnvelope,
    eventsRequest: Extract<
      DecodedRemoteExecutionRequestEnvelope['request'],
      { operation: 'events.read' }
    >
  ): RemoteExecutionResponseEnvelope {
    const { executionId, afterCursor, limit } = eventsRequest.payload;
    const stored = this.executionsById.get(executionId);
    if (!stored) return failure(request, 'not-found');
    let events = stored.events.slice(afterCursor, afterCursor + limit);
    if (this.gapNextEvents && events.length > 1) {
      this.gapNextEvents = false;
      events = events.slice(1);
    }
    if (this.reorderNextEvents && events.length > 1) {
      this.reorderNextEvents = false;
      events = [...events].reverse();
    }
    const providerId = this.providerDriftNext
      ? 'drifted-provider'
      : stored.record.provider.id;
    this.providerDriftNext = false;
    return createRemoteExecutionSuccessEnvelope(request, {
      executionId,
      providerId,
      afterCursor,
      latestCursor: stored.events.length,
      hasMore: afterCursor + events.length < stored.events.length,
      events: events.map((event) => ({
        cursor: event.sequence,
        event,
      })),
    });
  }
}
