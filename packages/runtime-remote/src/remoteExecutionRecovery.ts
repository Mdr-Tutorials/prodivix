import {
  RemoteExecutionClientError,
  RemoteExecutionRecoveryRequiredError,
} from './remoteExecutionClient';
import type { ExecutionJobStatus } from '@prodivix/runtime-core';
import {
  REMOTE_EXECUTION_PROTOCOL_LIMITS,
  type RemoteExecutionArtifactDescriptor,
  type RemoteExecutionClient,
  type RemoteExecutionEventRecord,
  type RemoteExecutionOperation,
  type RemoteExecutionRecord,
} from './remoteExecutionProtocol.types';

export type RemoteExecutionRecoveryPlan =
  | Readonly<{
      status: 'reconnect';
      reason:
        | 'transport-unavailable'
        | 'transport-timeout'
        | 'authoritative-refresh-required';
      executionStrategy: 'same-execution';
      afterCursor: number;
      automatic: true;
      preserveEvents: true;
      replayMutations: false;
    }>
  | Readonly<{
      status: 'retry-request';
      reason: 'transport-unavailable' | 'request-timeout';
      requestStrategy: 'same-request-identity';
      automatic: false;
      preserveEvents: true;
      replayMutations: false;
    }>
  | Readonly<{
      status: 'restore-authorization';
      reason: 'authorization-required';
      resumeStrategy: 'same-request' | 'same-execution';
      afterCursor: number;
      automatic: false;
      preserveEvents: true;
      replayMutations: false;
    }>
  | Readonly<{
      status: 'wait-for-capacity';
      reason: 'quota-exceeded';
      requestStrategy: 'new-request';
      automatic: false;
      preserveEvents: true;
      replayMutations: false;
    }>
  | Readonly<{
      status: 'new-request';
      reason:
        | 'artifact-expired'
        | 'artifact-missing'
        | 'worker-recovery-exhausted'
        | 'execution-cancelled'
        | 'execution-timed-out';
      requestStrategy: 'new-request';
      automatic: false;
      preserveEvents: true;
      replayMutations: false;
    }>
  | Readonly<{
      status: 'blocked';
      reason:
        | 'permission-denied'
        | 'network-policy-denied'
        | 'non-retryable'
        | 'unknown-failure';
      automatic: false;
      preserveEvents: true;
      replayMutations: false;
    }>;

export type RemoteExecutionReconnectResult = Readonly<{
  execution: RemoteExecutionRecord;
  events: readonly RemoteExecutionEventRecord[];
  afterCursor: number;
  nextCursor: number;
  caughtUp: boolean;
}>;

export type RemoteExecutionArtifactRecovery =
  | Readonly<{
      status: 'available';
      artifact: RemoteExecutionArtifactDescriptor;
    }>
  | Readonly<{
      status: 'new-request';
      reason: 'artifact-expired' | 'artifact-missing';
      requestStrategy: 'new-request';
      automatic: false;
      preserveEvents: true;
      replayMutations: false;
    }>;

const positiveInteger = (value: number, label: string): number => {
  if (!Number.isSafeInteger(value) || value < 1)
    throw new TypeError(`${label} must be a positive integer.`);
  return value;
};

const cursor = (value: number): number => {
  if (!Number.isSafeInteger(value) || value < 0)
    throw new TypeError(
      'Remote recovery cursor must be a non-negative integer.'
    );
  return value;
};

const assertExecutionIdentity = (
  execution: RemoteExecutionRecord,
  expected: Readonly<{
    executionId: string;
    requestId: string;
    snapshotDigest: string;
    providerId: string;
  }>
): void => {
  if (
    execution.executionId !== expected.executionId ||
    execution.requestId !== expected.requestId ||
    execution.snapshotDigest !== expected.snapshotDigest ||
    execution.provider.id !== expected.providerId
  )
    throw new RemoteExecutionRecoveryRequiredError(
      'Remote reconnect identity drifted from the immutable execution.',
      'get'
    );
};

/**
 * Reads authoritative state and a bounded, contiguous durable-event suffix.
 * It never creates an execution or replays an effectful request.
 */
export const reconnectRemoteExecution = async (
  input: Readonly<{
    client: Pick<RemoteExecutionClient, 'get' | 'readEvents'>;
    expected: Readonly<{
      executionId: string;
      requestId: string;
      snapshotDigest: string;
      providerId: string;
    }>;
    afterCursor: number;
    pageSize?: number;
    maximumPages?: number;
  }>
): Promise<RemoteExecutionReconnectResult> => {
  const afterCursor = cursor(input.afterCursor);
  const pageSize = positiveInteger(
    input.pageSize ?? 200,
    'Remote recovery page size'
  );
  const maximumPages = positiveInteger(
    input.maximumPages ?? 32,
    'Remote recovery maximum pages'
  );
  if (pageSize > REMOTE_EXECUTION_PROTOCOL_LIMITS.maxArrayEntries)
    throw new TypeError('Remote recovery page size exceeds protocol limits.');

  let execution = await input.client.get(input.expected.executionId);
  assertExecutionIdentity(execution, input.expected);
  let nextCursor = afterCursor;
  const events: RemoteExecutionEventRecord[] = [];

  for (
    let pageIndex = 0;
    pageIndex < maximumPages && nextCursor < execution.latestCursor;
    pageIndex += 1
  ) {
    const page = await input.client.readEvents({
      executionId: input.expected.executionId,
      afterCursor: nextCursor,
      limit: pageSize,
    });
    if (
      page.executionId !== input.expected.executionId ||
      page.providerId !== input.expected.providerId ||
      page.afterCursor !== nextCursor
    )
      throw new RemoteExecutionRecoveryRequiredError(
        'Remote reconnect event-page identity drifted.',
        'events.read'
      );
    for (const event of page.events) {
      if (
        event.cursor !== nextCursor + 1 ||
        event.event.sequence !== event.cursor ||
        event.event.jobId !== input.expected.executionId
      )
        throw new RemoteExecutionRecoveryRequiredError(
          'Remote reconnect event cursor is not contiguous.',
          'events.read'
        );
      events.push(event);
      nextCursor = event.cursor;
    }
    if (!page.events.length && page.latestCursor > nextCursor)
      throw new RemoteExecutionRecoveryRequiredError(
        'Remote reconnect could not advance to the advertised cursor.',
        'events.read'
      );
    if (!page.hasMore) break;
  }

  execution = await input.client.get(input.expected.executionId);
  assertExecutionIdentity(execution, input.expected);
  if (execution.latestCursor < nextCursor)
    throw new RemoteExecutionRecoveryRequiredError(
      'Remote reconnect status regressed behind the confirmed cursor.',
      'get'
    );
  return Object.freeze({
    execution,
    events: Object.freeze(events),
    afterCursor,
    nextCursor,
    caughtUp: nextCursor >= execution.latestCursor,
  });
};

const newArtifactRequest = (
  reason: 'artifact-expired' | 'artifact-missing'
): Extract<RemoteExecutionArtifactRecovery, { status: 'new-request' }> =>
  Object.freeze({
    status: 'new-request',
    reason,
    requestStrategy: 'new-request',
    automatic: false,
    preserveEvents: true,
    replayMutations: false,
  });

/** Resolves the same durable artifact identity or requires an explicit new Job. */
export const recoverRemoteExecutionArtifact = async (
  input: Readonly<{
    client: Pick<RemoteExecutionClient, 'resolveArtifact'>;
    executionId: string;
    artifactId: string;
    knownDescriptor?: RemoteExecutionArtifactDescriptor;
    now?: () => number;
  }>
): Promise<RemoteExecutionArtifactRecovery> => {
  const now = input.now ?? Date.now;
  const known = input.knownDescriptor;
  if (known && known.artifactId !== input.artifactId)
    throw new TypeError('Remote recovery artifact identity does not match.');
  if (known && known.expiresAt <= now())
    return newArtifactRequest('artifact-expired');
  try {
    const result = await input.client.resolveArtifact({
      executionId: input.executionId,
      artifactId: input.artifactId,
    });
    const artifact = result.artifact;
    if (
      result.executionId !== input.executionId ||
      artifact.artifactId !== input.artifactId ||
      artifact.authorizationScope !== `execution:${input.executionId}`
    )
      throw new RemoteExecutionRecoveryRequiredError(
        'Remote artifact recovery identity drifted.',
        'artifact.resolve'
      );
    if (artifact.expiresAt <= now())
      return newArtifactRequest('artifact-expired');
    if (
      known &&
      (artifact.kind !== known.kind ||
        artifact.mediaType !== known.mediaType ||
        artifact.size !== known.size ||
        artifact.digest !== known.digest)
    )
      throw new RemoteExecutionRecoveryRequiredError(
        'Remote artifact recovery changed immutable descriptor facts.',
        'artifact.resolve'
      );
    return Object.freeze({ status: 'available', artifact });
  } catch (error) {
    if (
      error instanceof RemoteExecutionClientError &&
      error.remoteCode === 'not-found'
    )
      return newArtifactRequest('artifact-missing');
    throw error;
  }
};

export const createRemoteExecutionRecoveryPlan = (input: {
  error?: unknown;
  operation?: RemoteExecutionOperation;
  terminalStatus?: ExecutionJobStatus;
  terminalReason?: string;
  afterCursor?: number;
}): RemoteExecutionRecoveryPlan => {
  const afterCursor = cursor(input.afterCursor ?? 0);
  const operation =
    input.operation ??
    (input.error instanceof RemoteExecutionClientError ||
    input.error instanceof RemoteExecutionRecoveryRequiredError
      ? input.error.operation
      : undefined);
  if (
    input.terminalReason === 'network-policy-denied' ||
    input.terminalReason === 'runtime-network-isolation-failed'
  )
    return Object.freeze({
      status: 'blocked',
      reason: 'network-policy-denied',
      automatic: false,
      preserveEvents: true,
      replayMutations: false,
    });
  if (input.terminalReason === 'secret-resolution-denied')
    return Object.freeze({
      status: 'blocked',
      reason: 'permission-denied',
      automatic: false,
      preserveEvents: true,
      replayMutations: false,
    });
  if (input.terminalReason === 'worker-recovery-exhausted')
    return Object.freeze({
      status: 'new-request',
      reason: 'worker-recovery-exhausted',
      requestStrategy: 'new-request',
      automatic: false,
      preserveEvents: true,
      replayMutations: false,
    });
  if (input.terminalStatus === 'cancelled')
    return Object.freeze({
      status: 'new-request',
      reason: 'execution-cancelled',
      requestStrategy: 'new-request',
      automatic: false,
      preserveEvents: true,
      replayMutations: false,
    });
  if (input.terminalStatus === 'timed-out')
    return Object.freeze({
      status: 'new-request',
      reason: 'execution-timed-out',
      requestStrategy: 'new-request',
      automatic: false,
      preserveEvents: true,
      replayMutations: false,
    });
  if (
    input.error instanceof RemoteExecutionClientError &&
    input.error.remoteCode === 'quota-exceeded'
  )
    return Object.freeze({
      status: 'wait-for-capacity',
      reason: 'quota-exceeded',
      requestStrategy: 'new-request',
      automatic: false,
      preserveEvents: true,
      replayMutations: false,
    });
  if (
    input.error instanceof RemoteExecutionClientError &&
    input.error.remoteCode === 'unauthorized'
  )
    return Object.freeze({
      status: 'restore-authorization',
      reason: 'authorization-required',
      resumeStrategy:
        operation === 'create' || operation === 'negotiate'
          ? 'same-request'
          : 'same-execution',
      afterCursor,
      automatic: false,
      preserveEvents: true,
      replayMutations: false,
    });
  if (
    input.error instanceof RemoteExecutionClientError &&
    input.error.remoteCode === 'forbidden'
  )
    return Object.freeze({
      status: 'blocked',
      reason: 'permission-denied',
      automatic: false,
      preserveEvents: true,
      replayMutations: false,
    });
  if (input.error instanceof RemoteExecutionRecoveryRequiredError)
    return Object.freeze({
      status: 'reconnect',
      reason: 'authoritative-refresh-required',
      executionStrategy: 'same-execution',
      afterCursor,
      automatic: true,
      preserveEvents: true,
      replayMutations: false,
    });
  if (
    input.error instanceof RemoteExecutionClientError &&
    input.error.retryable
  ) {
    if (operation === 'create' || operation === 'negotiate')
      return Object.freeze({
        status: 'retry-request',
        reason:
          input.error.remoteCode === 'timeout'
            ? 'request-timeout'
            : 'transport-unavailable',
        requestStrategy: 'same-request-identity',
        automatic: false,
        preserveEvents: true,
        replayMutations: false,
      });
    return Object.freeze({
      status: 'reconnect',
      reason:
        input.error.remoteCode === 'timeout'
          ? 'transport-timeout'
          : 'transport-unavailable',
      executionStrategy: 'same-execution',
      afterCursor,
      automatic: true,
      preserveEvents: true,
      replayMutations: false,
    });
  }
  if (input.error instanceof RemoteExecutionClientError)
    return Object.freeze({
      status: 'blocked',
      reason: 'non-retryable',
      automatic: false,
      preserveEvents: true,
      replayMutations: false,
    });
  return Object.freeze({
    status: 'blocked',
    reason: 'unknown-failure',
    automatic: false,
    preserveEvents: true,
    replayMutations: false,
  });
};
