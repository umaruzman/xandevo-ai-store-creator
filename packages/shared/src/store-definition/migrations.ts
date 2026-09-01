import { CURRENT_SCHEMA_VERSION, type StoreDefinition } from './store-definition.js';

/**
 * Forward migrations for persisted (normalized) Store Definitions.
 *
 * A migration `N` transforms a definition at `schemaVersion === N` into one at
 * `schemaVersion === N + 1`. v1 is the first version, so there are none yet.
 * Each future migration is a pure function added here.
 */
export type StoreDefinitionMigration = (input: Record<string, unknown>) => Record<string, unknown>;

export const MIGRATIONS: Record<number, StoreDefinitionMigration> = {
  // 1: (def) => ({ ...def, schemaVersion: 2, /* … */ }),
};

export class UnsupportedSchemaVersionError extends Error {
  constructor(readonly version: unknown) {
    super(`Unsupported Store Definition schemaVersion: ${String(version)}`);
    this.name = 'UnsupportedSchemaVersionError';
  }
}

/**
 * Bring a raw persisted definition up to `CURRENT_SCHEMA_VERSION` by applying
 * migrations in order. Throws if the version is missing, newer than supported,
 * or has no migration path.
 */
export function migrateToLatest(raw: Record<string, unknown>): Record<string, unknown> {
  const version = raw.schemaVersion;
  if (typeof version !== 'number' || !Number.isInteger(version) || version < 1) {
    throw new UnsupportedSchemaVersionError(version);
  }
  if (version > CURRENT_SCHEMA_VERSION) {
    throw new UnsupportedSchemaVersionError(version);
  }

  let current = raw;
  for (let v = version; v < CURRENT_SCHEMA_VERSION; v += 1) {
    const migrate = MIGRATIONS[v];
    if (!migrate) throw new UnsupportedSchemaVersionError(v);
    current = migrate(current);
  }
  return current;
}

export function isCurrentSchemaVersion(def: Pick<StoreDefinition, 'schemaVersion'>): boolean {
  return def.schemaVersion === CURRENT_SCHEMA_VERSION;
}
