import type { ExecutionFilesystemDiff } from '@prodivix/runtime-core';

export type ExecutionFilesystemArtifactReference = Readonly<{
  executionId: string;
  jobId: string;
  providerId: string;
  artifactId: string;
  snapshotDigest: string;
  workspaceSnapshotId: string;
  resolve(): Promise<ExecutionFilesystemDiff>;
}>;
