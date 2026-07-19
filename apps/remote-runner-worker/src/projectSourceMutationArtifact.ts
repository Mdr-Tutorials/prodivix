import {
  decodeExecutionFilesystemDiff,
  EXECUTION_FILESYSTEM_DIFF_MEDIA_TYPE,
  type ExecutableProjectSnapshot,
} from '@prodivix/runtime-core';
import {
  ISOLATED_SERVER_FUNCTION_SOURCE_MUTATION_DIRECTORY,
  ISOLATED_SERVER_FUNCTION_SOURCE_MUTATION_MAX_BYTES,
  isIsolatedServerFunctionProjectSourceMutationDefinition,
  readIsolatedServerFunctionPlan,
  type ExecutionServerFunctionBridgeResponse,
} from '@prodivix/server-runtime';
import type { RemoteWorkerSandboxArtifact } from './worker.types';

export type RemoteWorkerProjectSourceMutationProjection = Readonly<{
  artifact: RemoteWorkerSandboxArtifact;
  targetArtifactId: string;
  changeId: string;
}>;

const exactMetadata = (
  actual: Readonly<Record<string, string>> | undefined,
  expected: Readonly<Record<string, string>>
): boolean =>
  Boolean(
    actual &&
    Object.keys(actual).length === Object.keys(expected).length &&
    Object.entries(expected).every(([key, value]) => actual[key] === value)
  );

const exactStringRecord = (
  actual: Readonly<Record<string, string>> | undefined,
  expected: Readonly<Record<string, string>> | undefined
): boolean =>
  actual === undefined || expected === undefined
    ? actual === expected
    : Object.keys(actual).length === Object.keys(expected).length &&
      Object.entries(expected).every(([key, value]) => actual[key] === value);

const exactCodeArtifactTrace = (
  value: ExecutableProjectSnapshot['files'][number]['sourceTrace']
): string | undefined => {
  if (value?.length !== 1) return undefined;
  const trace = value[0];
  return trace &&
    trace.sourceRef.kind === 'code-artifact' &&
    trace.sourceSpan === undefined
    ? trace.sourceRef.artifactId
    : undefined;
};

const sameExactCodeArtifactTrace = (
  actual: ExecutableProjectSnapshot['files'][number]['sourceTrace'],
  expected: ExecutableProjectSnapshot['files'][number]['sourceTrace'],
  artifactId: string
): boolean => {
  const actualTrace = actual?.[0];
  const expectedTrace = expected?.[0];
  return Boolean(
    actual?.length === 1 &&
    expected?.length === 1 &&
    actualTrace &&
    expectedTrace &&
    exactCodeArtifactTrace(actual) === artifactId &&
    exactCodeArtifactTrace(expected) === artifactId &&
    actualTrace.label === expectedTrace.label &&
    JSON.stringify(Object.keys(actualTrace).sort()) ===
      JSON.stringify(Object.keys(expectedTrace).sort()) &&
    JSON.stringify(Object.keys(actualTrace.sourceRef).sort()) ===
      JSON.stringify(Object.keys(expectedTrace.sourceRef).sort())
  );
};

/**
 * Correlates a successful source-mutation invocation with one trusted,
 * complete, whole-file diff before either artifact can become durable.
 */
export const readRemoteWorkerProjectSourceMutationArtifact = (input: {
  snapshot: ExecutableProjectSnapshot;
  response: ExecutionServerFunctionBridgeResponse;
  artifacts: readonly RemoteWorkerSandboxArtifact[];
}): RemoteWorkerProjectSourceMutationProjection | undefined => {
  const isolated = readIsolatedServerFunctionPlan(
    input.snapshot.serverFunctionPlan
  );
  if (
    !isolated ||
    !isIsolatedServerFunctionProjectSourceMutationDefinition(
      isolated.definition
    ) ||
    !input.response.ok
  )
    return undefined;
  const filesystemArtifacts = input.artifacts.filter(
    ({ mediaType }) => mediaType === EXECUTION_FILESYSTEM_DIFF_MEDIA_TYPE
  );
  const artifact = filesystemArtifacts[0];
  if (
    filesystemArtifacts.length !== 1 ||
    !artifact ||
    artifact.kind !== 'report' ||
    artifact.artifactId !== `filesystem-diff:${input.snapshot.contentDigest}`
  )
    return undefined;
  let diff;
  try {
    diff = decodeExecutionFilesystemDiff(artifact.contents);
  } catch {
    return undefined;
  }
  const change = diff.changes[0];
  if (
    diff.snapshotDigest !== input.snapshot.contentDigest ||
    diff.workspace.workspaceId !== input.snapshot.workspace.workspaceId ||
    diff.workspace.snapshotId !== input.snapshot.workspace.snapshotId ||
    !exactStringRecord(
      diff.workspace.partitionRevisions,
      input.snapshot.workspace.partitionRevisions
    ) ||
    !diff.complete ||
    diff.changes.length !== 1 ||
    !change ||
    change.kind !== 'modified' ||
    !change.path.startsWith(
      `${ISOLATED_SERVER_FUNCTION_SOURCE_MUTATION_DIRECTORY}/`
    ) ||
    !change.baseline ||
    !change.runtime ||
    change.runtime.contents.byteLength >
      ISOLATED_SERVER_FUNCTION_SOURCE_MUTATION_MAX_BYTES
  )
    return undefined;
  const snapshotFile = input.snapshot.files.find(
    ({ path }) => path === change.path
  );
  const artifactId = exactCodeArtifactTrace(snapshotFile?.sourceTrace);
  if (
    !snapshotFile ||
    !artifactId ||
    !Buffer.from(change.baseline.contents).equals(
      Buffer.from(snapshotFile.contents)
    ) ||
    Buffer.from(change.baseline.contents).equals(
      Buffer.from(change.runtime.contents)
    ) ||
    !sameExactCodeArtifactTrace(
      change.sourceTrace,
      snapshotFile.sourceTrace,
      artifactId
    ) ||
    !sameExactCodeArtifactTrace(
      artifact.sourceTrace,
      snapshotFile.sourceTrace,
      artifactId
    ) ||
    !exactMetadata(artifact.metadata, {
      format: diff.format,
      snapshotDigest: input.snapshot.contentDigest,
      workspaceSnapshotId: input.snapshot.workspace.snapshotId,
      changeCount: '1',
      complete: 'true',
    })
  )
    return undefined;
  try {
    const source = new TextDecoder('utf-8', { fatal: true }).decode(
      change.runtime.contents
    );
    if (source.includes('\0')) return undefined;
  } catch {
    return undefined;
  }
  return Object.freeze({
    artifact,
    targetArtifactId: artifactId,
    changeId: change.changeId,
  });
};
