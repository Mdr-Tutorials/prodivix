import { createBrowserProjectRuntimeHost } from '@prodivix/runtime-browser';
import type { ExecutableProjectSnapshot } from '@prodivix/runtime-core';

type RetainedSnapshot = {
  references: number;
  snapshot: ExecutableProjectSnapshot;
};

const snapshots = new Map<string, RetainedSnapshot>();

const snapshotKey = (workspaceId: string, snapshotId: string): string =>
  JSON.stringify([workspaceId, snapshotId]);

const snapshotsEqual = (
  left: ExecutableProjectSnapshot,
  right: ExecutableProjectSnapshot
): boolean =>
  left.workspace.workspaceId === right.workspace.workspaceId &&
  left.workspace.snapshotId === right.workspace.snapshotId &&
  left.contentDigest === right.contentDigest;

export const browserProjectRuntimeHost = createBrowserProjectRuntimeHost();

export const resolveBrowserProjectExecutionSnapshot = (
  workspaceId: string,
  snapshotId: string
): ExecutableProjectSnapshot => {
  const retained = snapshots.get(snapshotKey(workspaceId, snapshotId));
  if (!retained) {
    throw new Error(
      `Executable project snapshot is unavailable: ${snapshotId}`
    );
  }
  return retained.snapshot;
};

/** Keeps an immutable project snapshot alive for exactly as long as its jobs. */
export const retainBrowserProjectExecutionSnapshot = (
  snapshot: ExecutableProjectSnapshot
): (() => void) => {
  const key = snapshotKey(
    snapshot.workspace.workspaceId,
    snapshot.workspace.snapshotId
  );
  const current = snapshots.get(key);
  if (current) {
    if (!snapshotsEqual(current.snapshot, snapshot)) {
      throw new Error(
        `Executable project snapshot identity was reused with different content: ${snapshot.workspace.snapshotId}`
      );
    }
    current.references += 1;
  } else {
    snapshots.set(key, { references: 1, snapshot });
  }

  let released = false;
  return () => {
    if (released) return;
    released = true;
    const retained = snapshots.get(key);
    if (!retained) return;
    retained.references -= 1;
    if (retained.references <= 0) snapshots.delete(key);
  };
};
