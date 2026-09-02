import { z } from 'zod';

import { PRODUCT_BADGES, PRODUCT_IMAGE_KINDS, PRODUCT_IMAGE_STYLES, zEnum } from './enums.js';
import {
  currencyCode,
  imageUrl,
  LIMITS,
  optionalText,
  priceMinor,
  slug,
  text,
  uuid,
} from './primitives.js';

// ── Product image ───────────────────────────────────────────────────────────
export const productImageSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('placeholder'),
    seed: slug,
    style: zEnum(PRODUCT_IMAGE_STYLES).optional(),
  }),
  z.object({
    kind: z.literal('url'),
    url: imageUrl,
    style: zEnum(PRODUCT_IMAGE_STYLES).optional(),
  }),
]);
export type ProductImage = z.infer<typeof productImageSchema>;

// ── Category ────────────────────────────────────────────────────────────────
const categoryBase = {
  name: text(LIMITS.name),
  slug,
  description: optionalText(LIMITS.description),
  accentColor: z
    .string()
    .regex(/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/)
    .optional(),
};

export const categoryInputSchema = z.object(categoryBase);
export const categorySchema = z.object({
  id: uuid,
  order: z.number().int().min(0),
  ...categoryBase,
});

export type CategoryInput = z.infer<typeof categoryInputSchema>;
export type Category = z.infer<typeof categorySchema>;

// ── Product ─────────────────────────────────────────────────────────────────
const productBase = {
  name: text(LIMITS.name),
  slug,
  description: text(LIMITS.description),
  priceMinor,
  currency: currencyCode,
  image: productImageSchema,
  featured: z.boolean(),
  badge: zEnum(PRODUCT_BADGES).optional(),
};

export const productInputSchema = z.object({
  ...productBase,
  categorySlug: slug,
});
export const productSchema = z.object({
  id: uuid,
  order: z.number().int().min(0),
  ...productBase,
  categoryId: uuid,
});

export type ProductInput = z.infer<typeof productInputSchema>;
export type Product = z.infer<typeof productSchema>;

export const PRODUCT_IMAGE_KIND_VALUES = PRODUCT_IMAGE_KINDS;
