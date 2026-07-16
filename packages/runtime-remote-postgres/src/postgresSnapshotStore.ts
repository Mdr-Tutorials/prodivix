import type { Pool } from 'pg';
import type {
  RemoteExecutionSnapshotStore,
  RemoteExecutionStoredSnapshot,
} from '@prodivix/runtime-remote';
import {
  decodeRemoteExecutableProjectSnapshot,
  encodeRemoteExecutableProjectSnapshot,
} from '@prodivix/runtime-remote';
import { withPostgresTransaction } from './postgresTransaction';

type SnapshotRow = Readonly<{
  snapshot_id: string;
  content_digest: string;
  snapshot_json: unknown;
  stored_at: string | number;
}>;

const safeInteger = (value: string | number, label: string): number => {
  const number = typeof value === 'number' ? value : Number(value);
  if (!Number.isSafeInteger(number) || number < 0)
    throw new TypeError(`${label} is invalid.`);
  return number;
};

const hydrate = (row: SnapshotRow): RemoteExecutionStoredSnapshot => {
  const snapshot = decodeRemoteExecutableProjectSnapshot(row.snapshot_json);
  if (
    snapshot.workspace.snapshotId !== row.snapshot_id ||
    snapshot.contentDigest !== row.content_digest
  ) {
    throw new TypeError('Stored remote snapshot identity is corrupt.');
  }
  return Object.freeze({
    snapshotId: row.snapshot_id,
    contentDigest: row.content_digest,
    snapshot,
    storedAt: safeInteger(row.stored_at, 'Stored remote snapshot timestamp'),
  });
};

export const createPostgresRemoteExecutionSnapshotStore = (
  pool: Pool
): RemoteExecutionSnapshotStore =>
  Object.freeze({
    async put(ownerId, snapshot, storedAt) {
      return withPostgresTransaction(pool, async (client) => {
        await client.query(
          `INSERT INTO remote_execution_snapshot_blobs
             (snapshot_id, content_digest, snapshot_json, stored_at)
           VALUES ($1, $2, $3::jsonb, $4)
           ON CONFLICT (snapshot_id, content_digest) DO NOTHING`,
          [
            snapshot.workspace.snapshotId,
            snapshot.contentDigest,
            JSON.stringify(encodeRemoteExecutableProjectSnapshot(snapshot)),
            storedAt,
          ]
        );
        await client.query(
          `INSERT INTO remote_execution_snapshot_grants
             (owner_id, snapshot_id, content_digest, granted_at)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (owner_id, snapshot_id, content_digest) DO NOTHING`,
          [
            ownerId,
            snapshot.workspace.snapshotId,
            snapshot.contentDigest,
            storedAt,
          ]
        );
        const result = await client.query<SnapshotRow>(
          `SELECT b.snapshot_id, b.content_digest, b.snapshot_json, b.stored_at
             FROM remote_execution_snapshot_blobs b
             JOIN remote_execution_snapshot_grants g
               USING (snapshot_id, content_digest)
            WHERE g.owner_id = $1 AND b.snapshot_id = $2 AND b.content_digest = $3`,
          [ownerId, snapshot.workspace.snapshotId, snapshot.contentDigest]
        );
        if (result.rowCount !== 1)
          throw new TypeError('Stored remote snapshot could not be read back.');
        return hydrate(result.rows[0]!);
      });
    },
    async get(ownerId, snapshotId, contentDigest) {
      const result = await pool.query<SnapshotRow>(
        `SELECT b.snapshot_id, b.content_digest, b.snapshot_json, b.stored_at
           FROM remote_execution_snapshot_blobs b
           JOIN remote_execution_snapshot_grants g
             USING (snapshot_id, content_digest)
          WHERE g.owner_id = $1 AND b.snapshot_id = $2 AND b.content_digest = $3`,
        [ownerId, snapshotId, contentDigest]
      );
      return result.rowCount === 1 ? hydrate(result.rows[0]!) : undefined;
    },
  });
