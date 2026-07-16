import type {
  ExecutableProjectSnapshot,
  ExecutionJobStatus,
} from '@prodivix/runtime-core';
import type {
  RemoteExecutionClaimResult,
  RemoteExecutionLease,
  RemoteExecutionArtifactDescriptor,
  RemoteExecutionWorkerEvent,
} from '@prodivix/runtime-remote';

export type RemoteWorkerControlPlaneClient = Readonly<{
  claim(
    input: Readonly<{
      workerId: string;
      providerId: string;
      leaseDurationMs: number;
    }>
  ): Promise<RemoteExecutionClaimResult | undefined>;
  renew(
    input: Readonly<{
      executionId: string;
      workerId: string;
      leaseToken: string;
      leaseDurationMs: number;
    }>
  ): Promise<
    | Readonly<{
        lease: RemoteExecutionLease;
        cancellationRequested: boolean;
      }>
    | undefined
  >;
  transition(
    input: Readonly<{
      executionId: string;
      workerId: string;
      leaseToken: string;
      status: ExecutionJobStatus;
      reason?: string;
    }>
  ): Promise<boolean>;
  snapshot(
    input: Readonly<{
      executionId: string;
      workerId: string;
      leaseToken: string;
    }>
  ): Promise<ExecutableProjectSnapshot | undefined>;
  appendEvent(
    input: Readonly<{
      executionId: string;
      workerId: string;
      leaseToken: string;
      workerEventId: string;
      event: RemoteExecutionWorkerEvent;
    }>
  ): Promise<'stored' | 'existing' | 'budget-exceeded' | 'rejected'>;
  uploadArtifact(
    input: Readonly<{
      executionId: string;
      workerId: string;
      leaseToken: string;
      workerEventId: string;
      descriptor: RemoteExecutionArtifactDescriptor;
      contents: Uint8Array;
    }>
  ): Promise<'stored' | 'existing' | 'budget-exceeded' | 'rejected'>;
}>;

export type RemoteWorkerSandboxResult = Readonly<{
  status: 'succeeded' | 'failed' | 'timed-out' | 'cancelled';
  exitCode?: number;
  stdout: string;
  stderr: string;
  outputTruncated: boolean;
  reason?: string;
  artifacts?: readonly Readonly<{
    descriptor: RemoteExecutionArtifactDescriptor;
    contents: Uint8Array;
  }>[];
}>;

export type RemoteWorkerSandbox = Readonly<{
  execute(
    input: Readonly<{
      executionId: string;
      snapshot: ExecutableProjectSnapshot;
      profile: 'preview' | 'test' | 'build';
      timeoutMs: number;
      maximumOutputBytes: number;
      redactValues: readonly string[];
      signal: AbortSignal;
    }>
  ): Promise<RemoteWorkerSandboxResult>;
}>;
