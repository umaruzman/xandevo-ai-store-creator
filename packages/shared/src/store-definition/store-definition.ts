import { z } from 'zod';

import {
  announcementBarInputSchema,
  announcementBarSchema,
  footerInputSchema,
  footerSchema,
  headerSchema,
  navigationInputSchema,
  navigationSchema,
} from './chrome.js';
import {
  categoryInputSchema,
  categorySchema,
  productInputSchema,
  productSchema,
} from './catalog.js';
import { pageInputSchema, pageSchema } from './page.js';
import { currencyCode, LIMITS, locale, optionalText, text, uuid } from './primitives.js';
import {
  themeColorsSchema,
  themeComponentsSchema,
  themeSchema,
  themeStyleSchema,
  themeTypographySchema,
} from './theme.js';
import { THEME_PRESETS, zEnum } from './enums.js';

/** Schema version this build understands. Bump when the normalized shape changes. */
export const CURRENT_SCHEMA_VERSION = 1;

export const metaSchema = z.object({
  name: text(LIMITS.name),
  tagline: optionalText(LIMITS.shortText),
  locale,
  currency: currencyCode,
});
export type Meta = z.infer<typeof metaSchema>;

// ── Theme (input): preset + colours required; the rest is filled from the preset ──
export const themeInputSchema = z.object({
  preset: zEnum(THEME_PRESETS),
  colors: themeColorsSchema,
  typography: themeTypographySchema.partial().optional(),
  style: themeStyleSchema.partial().optional(),
  components: z
    .object({
      productCard: themeComponentsSchema.shape.productCard.partial().optional(),
      button: themeComponentsSchema.shape.button.partial().optional(),
      categoryCard: themeComponentsSchema.shape.categoryCard.partial().optional(),
    })
    .optional(),
});
export type ThemeInput = z.infer<typeof themeInputSchema>;

// ── Input: what `POST /generate` produces and schema-validation runs on ──────
export const storeDefinitionInputSchema = z.object({
  schemaVersion: z.literal(CURRENT_SCHEMA_VERSION).optional(),
  meta: metaSchema,
  theme: themeInputSchema,
  navigation: navigationInputSchema,
  header: headerSchema,
  footer: footerInputSchema,
  announcementBar: announcementBarInputSchema.optional(),
  pages: z.array(pageInputSchema).min(3).max(12),
  categories: z.array(categoryInputSchema).min(1).max(8),
  products: z.array(productInputSchema).min(3).max(40),
});
export type StoreDefinitionInput = z.infer<typeof storeDefinitionInputSchema>;

// ── Normalized: trusted, id-bearing, ref-resolved. Persisted & rendered. ────
export const storeDefinitionSchema = z.object({
  schemaVersion: z.number().int().positive(),
  id: uuid.optional(),
  meta: metaSchema,
  theme: themeSchema,
  navigation: navigationSchema,
  header: headerSchema,
  footer: footerSchema,
  announcementBar: announcementBarSchema.optional(),
  pages: z.array(pageSchema).min(3).max(12),
  categories: z.array(categorySchema).min(1).max(8),
  products: z.array(productSchema).min(3).max(40),
});
export type StoreDefinition = z.infer<typeof storeDefinitionSchema>;
