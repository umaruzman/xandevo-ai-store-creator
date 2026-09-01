import {
  storeDefinitionInputSchema,
  type StoreDefinition,
} from '../store-definition/store-definition.js';
import { StoreDefinitionError } from './errors.js';
import { normalizeStoreDefinition, type NormalizeOptions } from './normalize.js';
import { sanitizeStoreDefinitionInput } from './sanitize.js';
import { zodIssuesToFieldIssues } from './schema-issues.js';
import { assertBusinessRules } from './validate.js';

/**
 * The full untrusted-input pipeline:
 *
 *   raw → parse → schema → business validation → sanitization → normalization
 *
 * Accepts a JSON string or an already-parsed value. Throws `StoreDefinitionError`
 * (carrying the failing stage + issues, never the raw input) on any failure.
 * The return value is a trusted, id-bearing, reference-resolved `StoreDefinition`.
 */
export function buildStoreDefinition(raw: unknown, options?: NormalizeOptions): StoreDefinition {
  let value: unknown = raw;
  if (typeof raw === 'string') {
    try {
      value = JSON.parse(raw);
    } catch {
      throw StoreDefinitionError.parse('response was not valid JSON');
    }
  }

  const parsed = storeDefinitionInputSchema.safeParse(value);
  if (!parsed.success) {
    throw StoreDefinitionError.schema(zodIssuesToFieldIssues(parsed.error.issues));
  }

  assertBusinessRules(parsed.data);
  const sanitized = sanitizeStoreDefinitionInput(parsed.data);
  return normalizeStoreDefinition(sanitized, options);
}
