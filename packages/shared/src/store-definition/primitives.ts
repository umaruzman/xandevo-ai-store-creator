import { z } from 'zod';

/** Field length caps (characters). Mirrored by the sanitizer. */
export const LIMITS = {
  headline: 80,
  subheadline: 120,
  shortText: 200,
  description: 400,
  richTextBody: 1500,
  slug: 60,
  name: 80,
  label: 40,
  handle: 60,
  address: 200,
} as const;

/** Price bounds in integer minor units (e.g. fils/cents). */
export const PRICE_MIN_MINOR = 1;
export const PRICE_MAX_MINOR = 100_000_00;

/** Non-empty, trimmed text with a max length. */
export const text = (max: number): z.ZodString => z.string().trim().min(1).max(max);

/** Optional trimmed text (may be omitted; empty string is coerced away by the sanitizer). */
export const optionalText = (max: number): z.ZodOptional<z.ZodString> =>
  z.string().trim().min(1).max(max).optional();

/** `#rgb` / `#rrggbb` hex colour. */
export const hexColor = z
  .string()
  .regex(/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'must be a #rgb or #rrggbb hex colour');

/** URL-safe slug: lowercase, digits, single dashes. */
export const slug = z
  .string()
  .trim()
  .min(1)
  .max(LIMITS.slug)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'must be a lowercase, dash-separated slug');

/** ISO 4217-ish 3-letter currency code (uppercase). */
export const currencyCode = z
  .string()
  .trim()
  .regex(/^[A-Z]{3}$/, 'must be a 3-letter uppercase currency code');

/** BCP-47-ish locale, e.g. `en-AE`. */
export const locale = z
  .string()
  .trim()
  .regex(/^[a-z]{2}(?:-[A-Z]{2})?$/, 'must be a locale like `en` or `en-AE`');

export const uuid = z.string().uuid();

/** Integer within an inclusive range. */
export const clampedInt = (min: number, max: number): z.ZodNumber =>
  z.number().int().min(min).max(max);

export const priceMinor = clampedInt(PRICE_MIN_MINOR, PRICE_MAX_MINOR);

/** An https URL on the allowlisted host set (MVP: none — external URLs are rejected). */
export const ALLOWED_URL_HOSTS: readonly string[] = [];

export const externalUrl = z
  .string()
  .trim()
  .url()
  .refine((value) => {
    const match = /^https:\/\/([^/?#]+)/i.exec(value);
    if (!match) return false;
    const host = (match[1] ?? '').toLowerCase().split(':')[0] ?? '';
    return ALLOWED_URL_HOSTS.includes(host);
  }, 'must be an https URL on an allowlisted host');
