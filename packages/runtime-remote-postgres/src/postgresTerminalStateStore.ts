import type { Pool } from 'pg';
import {
  REMOTE_EXECUTION_TERMINAL_STATE_LIMITS,
  type RemoteExecutionTerminalStateRecord,
  type RemoteExecutionTerminalStateStore,
} from '@prodivix/runtime-remote';
import { withPostgresTransaction } from './postgresTransaction';

type TerminalStateRow = Readonly<{
  execution_id: string;
  terminal_session_id: string;
  state_revision: string | number;
  expires_at: string | number;
  sealed_state: Buffer;
}>;

const integer = (
  value: string | number,
  label: string,
  minimum = 0
): number => {
  const result = typeof value === 'number' ? value : Number(value);
  if (!Number.isSafeInteger(result) || result < minimum)
    throw new TypeError(`${label} is corrupt.`);
  return result;
};

const boundedRecord = (
  record: RemoteExecutionTerminalStateRecord
): RemoteExecutionTerminalStateRecord => {
  if (
    !record.executionId ||
    record.executionId !== record.executionId.trim() ||
    !record.terminalSessionId ||
    record.terminalSessionId !== record.terminalSessionId.trim() ||
    !Number.isSafeInteger(record.revision) ||
    record.revision < 1 ||
    !Number.isFinite(record.expiresAt) ||
    record.expiresAt < 0 ||
    !(record.sealedState instanceof Uint8Array) ||
    record.sealedState.byteLength < 1 ||
    record.sealedState.byteLength >
      REMOTE_EXECUTION_TERMINAL_STATE_LIMITS.maximumSealedBytes
  )
    throw new TypeError('Remote Terminal state record is invalid.');
  return record;
};

const hydrate = (row: TerminalStateRow): RemoteExecutionTerminalStateRecord =>
  boundedRecord(
    Object.freeze({
      executionId: row.execution_id,
      terminalSessionId: row.terminal_session_id,
      revision: integer(
        row.state_revision,
        'Stored Remote Terminal state revision',
        1
      ),
      expiresAt: integer(row.expires_at, 'Stored Remote Terminal state expiry'),
      sealedState: Uint8Array.from(row.sealed_state),
    })
  );

const selectColumns = `execution_id, terminal_session_id, state_revision,
  expires_at, sealed_state`;

/** Stores only opaque authenticated ciphertext; plaintext never crosses this adapter. */
export const createPostgresRemoteExecutionTerminalStateStore = (
  pool: Pool
): RemoteExecutionTerminalStateStore =>
  Object.freeze({
    async getByExecution(executionId) {
      const result = await pool.query<TerminalStateRow>(
        `SELECT ${selectColumns}
           FROM remote_execution_terminal_sessions
          WHERE execution_id=$1`,
        [executionId]
      );
      return result.rowCount === 1 ? hydrate(result.rows[0]!) : undefined;
    },
    async get(executionId, terminalSessionId) {
      const result = await pool.query<TerminalStateRow>(
        `SELECT ${selectColumns}
           FROM remote_execution_terminal_sessions
          WHERE execution_id=$1 AND terminal_session_id=$2`,
        [executionId, terminalSessionId]
      );
      return result.rowCount === 1 ? hydrate(result.rows[0]!) : undefined;
    },
    async create(record, maximumRecords) {
      boundedRecord(record);
      if (
        !Number.isSafeInteger(maximumRecords) ||
        maximumRecords < 1 ||
        maximumRecords > 1_000
      )
        throw new TypeError('Remote Terminal state record budget is invalid.');
      return withPostgresTransaction(pool, async (client) => {
        await client.query(
          `SELECT pg_advisory_xact_lock(hashtext('prodivix.remote-terminal.sessions.v1'))`
        );
        const conflict = await client.query(
          `SELECT 1 FROM remote_execution_terminal_sessions
            WHERE execution_id=$1 OR terminal_session_id=$2 LIMIT 1`,
          [record.executionId, record.terminalSessionId]
        );
        if (conflict.rowCount) return 'identity-conflict' as const;
        const count = await client.query<{ count: string }>(
          `SELECT COUNT(*)::text AS count
             FROM remote_execution_terminal_sessions`
        );
        if (Number(count.rows[0]?.count) >= maximumRecords)
          return 'quota-exceeded' as const;
        const inserted = await client.query(
          `INSERT INTO remote_execution_terminal_sessions
             (execution_id, terminal_session_id, state_revision, expires_at, sealed_state)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT DO NOTHING`,
          [
            record.executionId,
            record.terminalSessionId,
            record.revision,
            record.expiresAt,
            Buffer.from(record.sealedState),
          ]
        );
        return inserted.rowCount === 1
          ? ('created' as const)
          : ('identity-conflict' as const);
      });
    },
    async compareAndSwap(expectedRevision, record) {
      boundedRecord(record);
      if (
        !Number.isSafeInteger(expectedRevision) ||
        expectedRevision < 1 ||
        record.revision !== expectedRevision + 1
      )
        throw new TypeError('Remote Terminal expected revision is invalid.');
      const result = await pool.query(
        `UPDATE remote_execution_terminal_sessions
            SET state_revision=$3, expires_at=$4, sealed_state=$5
          WHERE execution_id=$1 AND terminal_session_id=$2
            AND state_revision=$6`,
        [
          record.executionId,
          record.terminalSessionId,
          record.revision,
          record.expiresAt,
          Buffer.from(record.sealedState),
          expectedRevision,
        ]
      );
      return result.rowCount === 1;
    },
    async delete(executionId, terminalSessionId, expectedRevision) {
      if (!Number.isSafeInteger(expectedRevision) || expectedRevision < 1)
        throw new TypeError('Remote Terminal expected revision is invalid.');
      const result = await pool.query(
        `DELETE FROM remote_execution_terminal_sessions
          WHERE execution_id=$1 AND terminal_session_id=$2
            AND state_revision=$3`,
        [executionId, terminalSessionId, expectedRevision]
      );
      return result.rowCount === 1;
    },
    async listExpired(expiresAtOrBefore, maximumRecords) {
      if (
        !Number.isFinite(expiresAtOrBefore) ||
        expiresAtOrBefore < 0 ||
        !Number.isSafeInteger(maximumRecords) ||
        maximumRecords < 1 ||
        maximumRecords >
          REMOTE_EXECUTION_TERMINAL_STATE_LIMITS.maximumSweepRecords
      )
        throw new TypeError('Remote Terminal sweep boundary is invalid.');
      const result = await pool.query<TerminalStateRow>(
        `SELECT ${selectColumns}
           FROM remote_execution_terminal_sessions
          WHERE expires_at <= $1
          ORDER BY expires_at ASC, execution_id ASC
          LIMIT $2`,
        [expiresAtOrBefore, maximumRecords]
      );
      return Object.freeze(result.rows.map(hydrate));
    },
  });
