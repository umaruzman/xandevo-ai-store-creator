import { LIMITS } from '../store-definition/primitives.js';
import {
  storeDefinitionInputSchema,
  type StoreDefinitionInput,
} from '../store-definition/store-definition.js';
import { StoreDefinitionError } from './errors.js';
import { zodIssuesToFieldIssues } from './schema-issues.js';

// Remove <script>/<style> blocks including their contents, then any remaining tags.
const SCRIPT_STYLE_BLOCK_RE = /<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi;
const TAG_RE = /<[^>]*>/g;

/** Drop C0 control characters and DEL. When `keepNewlines`, TAB (0x09) and LF (0x0A) survive. */
function stripControls(value: string, keepNewlines: boolean): string {
  let out = '';
  for (const ch of value) {
    const code = ch.codePointAt(0)!;
    const isControl = code <= 0x1f || code === 0x7f;
    if (!isControl || (keepNewlines && (code === 0x09 || code === 0x0a))) out += ch;
  }
  return out;
}

/** Collapse to a single line: drop script/style blocks & tags, normalise whitespace. */
function cleanInline(value: string, max: number): string {
  const noMarkup = value
    .replace(SCRIPT_STYLE_BLOCK_RE, '')
    .replace(TAG_RE, '')
    .replace(/\s+/g, ' '); // tabs/newlines become spaces before controls are stripped
  return stripControls(noMarkup, false).trim().slice(0, max);
}

/** Preserve paragraph breaks: drop script/style blocks & tags, collapse spaces, keep newlines. */
function cleanMultiline(value: string, max: number): string {
  return stripControls(value.replace(SCRIPT_STYLE_BLOCK_RE, '').replace(TAG_RE, ''), true)
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, max);
}

function cleanValue(key: string, value: unknown): unknown {
  if (typeof value === 'string') {
    return key === 'body'
      ? cleanMultiline(value, LIMITS.richTextBody)
      : cleanInline(value, LIMITS.richTextBody);
  }
  if (Array.isArray(value)) return value.map((item) => cleanValue(key, item));
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, cleanValue(k, v)]),
    );
  }
  return value;
}

/** Strip markup / control characters from every string in an arbitrary object tree. */
export function cleanStrings<T>(obj: T): T {
  return cleanValue('', obj) as T;
}

/**
 * Strip markup / control characters from every string in a schema-valid input.
 * Enum, slug, colour and URL values are unaffected (no markup, no internal
 * whitespace). The result is re-validated: cleaning that empties a required
 * field is a sanitize-stage failure.
 */
export function sanitizeStoreDefinitionInput(input: StoreDefinitionInput): StoreDefinitionInput {
  const cleaned = cleanValue('', input);
  const parsed = storeDefinitionInputSchema.safeParse(cleaned);
  if (!parsed.success) {
    throw new StoreDefinitionError(
      'sanitize',
      'Store Definition became invalid after sanitization',
      zodIssuesToFieldIssues(parsed.error.issues),
    );
  }
  return parsed.data;
}
