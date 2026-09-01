/**
 * @xandevo/shared — the cross-app contract.
 *
 * - `store-definition/*` — the versioned Zod schema (input + normalized forms),
 *   inferred types, enums, and forward migrations.
 * - `domain/*` — the pure untrusted-input pipeline: schema → business validation
 *   → sanitization → normalization.
 * - `api/*` — REST transport DTO types.
 *
 * Test fixtures are also available from `@xandevo/shared/testing`.
 */

export * from './store-definition/index.js';
export * from './domain/index.js';
export * from './api/index.js';
export * from './testing/fixtures.js';
export * from './testing/ids.js';

export { CURRENT_SCHEMA_VERSION as STORE_DEFINITION_SCHEMA_VERSION } from './store-definition/store-definition.js';
