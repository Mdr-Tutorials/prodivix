import type { PIRWireMigration } from './pirMigrationRegistry';

type WireRecord = Readonly<Record<string, unknown>>;

const isRecord = (value: unknown): value is WireRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * Promotes an immutable v1.4 wire document into the additive v1.5 envelope.
 * Existing authoring content is already valid because the new bindings are optional.
 */
export const migratePirWireV14ToV15 = (wireDocument: unknown): unknown => {
  if (!isRecord(wireDocument) || wireDocument.version !== '1.4') {
    throw new TypeError('PIR v1.4 migration requires a v1.4 wire document.');
  }
  return { ...wireDocument, version: '1.5' };
};

export const PIR_WIRE_MIGRATION_V14_TO_V15: PIRWireMigration = Object.freeze({
  fromVersion: '1.4',
  toVersion: '1.5',
  migrate: migratePirWireV14ToV15,
});
