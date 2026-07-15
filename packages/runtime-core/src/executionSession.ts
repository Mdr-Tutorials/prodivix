import type {
  ExecutionCancellationRequest,
  ExecutionCancellationResult,
  ExecutionInvocationKind,
  ExecutionJob,
  ExecutionJobEvent,
  ExecutionJobStatus,
  ExecutionProfile,
  ExecutionWorkspaceSnapshotRef,
  RuntimeZone,
} from './execution.types';

export type ExecutionSessionStatus = 'idle' | ExecutionJobStatus;

export type ExecutionSessionActiveJob = Readonly<{
  jobId: string;
  requestId: string;
  providerId: string;
  providerVersion: string;
  profile: ExecutionProfile;
  runtimeZone: RuntimeZone;
  invocationKind: ExecutionInvocationKind;
  workspace: ExecutionWorkspaceSnapshotRef;
}>;

export type ExecutionSessionEventRecord = Readonly<{
  sessionId: string;
  jobId: string;
  requestId: string;
  providerId: string;
  workspaceId: string;
  snapshotId: string;
  event: ExecutionJobEvent;
}>;

export type ExecutionSessionSnapshot = Readonly<{
  sessionId: string;
  label?: string;
  revision: number;
  status: ExecutionSessionStatus;
  activeJob?: ExecutionSessionActiveJob;
  events: readonly ExecutionSessionEventRecord[];
  updatedAt?: number;
}>;

export type ActivateExecutionSessionInput = Readonly<{
  sessionId: string;
  job: ExecutionJob;
  label?: string;
  preserveEvents?: boolean;
}>;

export type ExecutionSessionCancellationResult =
  ExecutionCancellationResult | Readonly<{ status: 'session-not-found' }>;

export type ExecutionSessionListener = (
  sessionId: string,
  snapshot: ExecutionSessionSnapshot | undefined
) => void;

export type ExecutionSessionCoordinator = Readonly<{
  activate(input: ActivateExecutionSessionInput): ExecutionSessionSnapshot;
  getSnapshot(sessionId: string): ExecutionSessionSnapshot | undefined;
  listSnapshots(): readonly ExecutionSessionSnapshot[];
  subscribe(listener: ExecutionSessionListener): () => void;
  clearEvents(sessionId: string): ExecutionSessionSnapshot | undefined;
  cancel(
    sessionId: string,
    request?: ExecutionCancellationRequest
  ): Promise<ExecutionSessionCancellationResult>;
  remove(sessionId: string): boolean;
}>;

export type CreateExecutionSessionCoordinatorInput = Readonly<{
  maxEvents?: number;
  onSubscriberError?: (error: unknown) => void;
}>;

type InternalSession = {
  job: ExecutionJob;
  snapshot: ExecutionSessionSnapshot;
  unsubscribe: () => void;
};

const normalizeIdentifier = (value: string, label: string): string => {
  const normalized = value.trim();
  if (!normalized) throw new TypeError(`${label} must not be empty.`);
  return normalized;
};

const createActiveJob = (job: ExecutionJob): ExecutionSessionActiveJob =>
  Object.freeze({
    jobId: job.id,
    requestId: job.request.requestId,
    providerId: job.provider.id,
    providerVersion: job.provider.version,
    profile: job.request.profile,
    runtimeZone: job.request.runtimeZone,
    invocationKind: job.request.invocation.kind,
    workspace: job.request.workspace,
  });

const createEventRecord = (
  sessionId: string,
  job: ExecutionJob,
  event: ExecutionJobEvent
): ExecutionSessionEventRecord =>
  Object.freeze({
    sessionId,
    jobId: job.id,
    requestId: job.request.requestId,
    providerId: job.provider.id,
    workspaceId: job.request.workspace.workspaceId,
    snapshotId: job.request.workspace.snapshotId,
    event,
  });

/**
 * Composes long-lived product sessions from revision-bound jobs. The
 * coordinator retains only bounded observable execution events; canonical
 * Workspace data and provider processes remain owned by their existing owners.
 */
export const createExecutionSessionCoordinator = (
  input: CreateExecutionSessionCoordinatorInput = {}
): ExecutionSessionCoordinator => {
  const maxEvents = input.maxEvents ?? 500;
  if (!Number.isSafeInteger(maxEvents) || maxEvents <= 0) {
    throw new TypeError(
      'Execution session maxEvents must be a positive safe integer.'
    );
  }
  const sessions = new Map<string, InternalSession>();
  const listeners = new Set<ExecutionSessionListener>();

  const reportSubscriberError = (error: unknown): void => {
    try {
      input.onSubscriberError?.(error);
    } catch {
      // Observability hooks cannot alter session coordination.
    }
  };

  const publish = (
    sessionId: string,
    snapshot: ExecutionSessionSnapshot | undefined
  ): void => {
    listeners.forEach((listener) => {
      try {
        listener(sessionId, snapshot);
      } catch (error) {
        reportSubscriberError(error);
      }
    });
  };

  const readSession = (sessionId: string): InternalSession | undefined =>
    sessions.get(normalizeIdentifier(sessionId, 'Execution session id'));

  const activate = (
    activation: ActivateExecutionSessionInput
  ): ExecutionSessionSnapshot => {
    const sessionId = normalizeIdentifier(
      activation.sessionId,
      'Execution session id'
    );
    const label =
      activation.label === undefined
        ? undefined
        : normalizeIdentifier(activation.label, 'Execution session label');
    const previous = sessions.get(sessionId);
    if (previous?.job === activation.job) {
      if (previous.snapshot.label === label || label === undefined) {
        return previous.snapshot;
      }
      previous.snapshot = Object.freeze({
        ...previous.snapshot,
        label,
        revision: previous.snapshot.revision + 1,
      });
      publish(sessionId, previous.snapshot);
      return previous.snapshot;
    }

    previous?.unsubscribe();
    const jobSnapshot = activation.job.getSnapshot();
    const replayBoundarySequence = jobSnapshot.latestEventSequence;
    const snapshot: ExecutionSessionSnapshot = Object.freeze({
      sessionId,
      ...(label
        ? { label }
        : previous?.snapshot.label
          ? { label: previous.snapshot.label }
          : {}),
      revision: (previous?.snapshot.revision ?? 0) + 1,
      status: jobSnapshot.status,
      activeJob: createActiveJob(activation.job),
      events: Object.freeze(
        activation.preserveEvents === false
          ? []
          : [...(previous?.snapshot.events ?? [])]
      ),
      updatedAt:
        jobSnapshot.completedAt ??
        jobSnapshot.cancellationRequestedAt ??
        jobSnapshot.startedAt ??
        jobSnapshot.createdAt,
    });
    const internal: InternalSession = {
      job: activation.job,
      snapshot,
      unsubscribe: () => undefined,
    };
    sessions.set(sessionId, internal);
    publish(sessionId, snapshot);

    const unsubscribe = activation.job.subscribe((event) => {
      if (sessions.get(sessionId) !== internal) return;
      const events = [
        ...internal.snapshot.events,
        createEventRecord(sessionId, activation.job, event),
      ].slice(-maxEvents);
      internal.snapshot = Object.freeze({
        ...internal.snapshot,
        revision: internal.snapshot.revision + 1,
        status:
          event.kind === 'state' && event.sequence > replayBoundarySequence
            ? event.snapshot.status
            : internal.snapshot.status,
        events: Object.freeze(events),
        updatedAt: Math.max(
          internal.snapshot.updatedAt ?? event.emittedAt,
          event.emittedAt
        ),
      });
      publish(sessionId, internal.snapshot);
    });
    if (sessions.get(sessionId) === internal)
      internal.unsubscribe = unsubscribe;
    else unsubscribe();
    return internal.snapshot;
  };

  return Object.freeze({
    activate,
    getSnapshot: (sessionId) => readSession(sessionId)?.snapshot,
    listSnapshots: () =>
      Object.freeze(
        [...sessions.values()]
          .map((session) => session.snapshot)
          .sort((left, right) => left.sessionId.localeCompare(right.sessionId))
      ),
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    clearEvents: (sessionId) => {
      const normalized = normalizeIdentifier(sessionId, 'Execution session id');
      const session = sessions.get(normalized);
      if (!session) return undefined;
      session.snapshot = Object.freeze({
        ...session.snapshot,
        revision: session.snapshot.revision + 1,
        events: Object.freeze([]),
      });
      publish(normalized, session.snapshot);
      return session.snapshot;
    },
    cancel: async (sessionId, request) => {
      const session = readSession(sessionId);
      if (!session) return Object.freeze({ status: 'session-not-found' });
      return session.job.cancel(request);
    },
    remove: (sessionId) => {
      const normalized = normalizeIdentifier(sessionId, 'Execution session id');
      const session = sessions.get(normalized);
      if (!session) return false;
      session.unsubscribe();
      sessions.delete(normalized);
      publish(normalized, undefined);
      return true;
    },
  });
};
