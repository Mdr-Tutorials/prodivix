import {
  createBrowserProjectRuntimeHost,
  type BrowserProjectSnapshot,
} from '@prodivix/runtime-browser';

type RetainedSnapshot = {
  references: number;
  snapshot: BrowserProjectSnapshot;
};

const snapshots = new Map<string, RetainedSnapshot>();

const snapshotKey = (workspaceId: string, snapshotId: string): string =>
  JSON.stringify([workspaceId, snapshotId]);

const contentsEqual = (
  left: string | Uint8Array,
  right: string | Uint8Array
): boolean => {
  if (typeof left === 'string' || typeof right === 'string') {
    return (
      typeof left === 'string' && typeof right === 'string' && left === right
    );
  }
  return (
    left.byteLength === right.byteLength &&
    left.every((value, index) => value === right[index])
  );
};

const snapshotsEqual = (
  left: BrowserProjectSnapshot,
  right: BrowserProjectSnapshot
): boolean =>
  left.workspaceId === right.workspaceId &&
  left.snapshotId === right.snapshotId &&
  JSON.stringify(left.installCommand) ===
    JSON.stringify(right.installCommand) &&
  JSON.stringify(left.startCommand) === JSON.stringify(right.startCommand) &&
  JSON.stringify(left.testPlan) === JSON.stringify(right.testPlan) &&
  left.files.length === right.files.length &&
  left.files.every((file, index) => {
    const candidate = right.files[index];
    return (
      candidate !== undefined &&
      file.path === candidate.path &&
      contentsEqual(file.contents, candidate.contents) &&
      JSON.stringify(file.sourceTrace ?? []) ===
        JSON.stringify(candidate.sourceTrace ?? [])
    );
  });

export const browserProjectRuntimeHost = createBrowserProjectRuntimeHost();

export const resolveBrowserProjectExecutionSnapshot = (
  workspaceId: string,
  snapshotId: string
): BrowserProjectSnapshot => {
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
  snapshot: BrowserProjectSnapshot
): (() => void) => {
  const key = snapshotKey(snapshot.workspaceId, snapshot.snapshotId);
  const current = snapshots.get(key);
  if (current) {
    if (!snapshotsEqual(current.snapshot, snapshot)) {
      throw new Error(
        `Executable project snapshot identity was reused with different content: ${snapshot.snapshotId}`
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
