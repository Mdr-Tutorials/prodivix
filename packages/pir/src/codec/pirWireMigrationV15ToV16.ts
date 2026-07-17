import type { PIRWireMigration } from './pirMigrationRegistry';

type WireRecord = Readonly<Record<string, unknown>>;

const isRecord = (value: unknown): value is WireRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/** Promotes an immutable v1.5 document into the additive v1.6 envelope. */
export const migratePirWireV15ToV16 = (wireDocument: unknown): unknown => {
  if (!isRecord(wireDocument) || wireDocument.version !== '1.5') {
    throw new TypeError('PIR v1.5 migration requires a v1.5 wire document.');
  }
  return { ...wireDocument, version: '1.6' };
};

export const PIR_WIRE_MIGRATION_V15_TO_V16: PIRWireMigration = Object.freeze({
  fromVersion: '1.5',
  toVersion: '1.6',
  migrate: migratePirWireV15ToV16,
});
