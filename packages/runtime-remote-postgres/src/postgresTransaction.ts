import type { Pool, PoolClient } from 'pg';

export const withPostgresTransaction = async <Result>(
  pool: Pick<Pool, 'connect'>,
  operation: (client: PoolClient) => Promise<Result>
): Promise<Result> => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await operation(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch {
      // Preserve the domain/SQL failure; pg will discard an unusable client.
    }
    throw error;
  } finally {
    client.release();
  }
};
