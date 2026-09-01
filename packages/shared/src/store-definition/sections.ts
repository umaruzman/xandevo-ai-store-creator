import { z } from 'zod';

import {
  CATEGORIES_LAYOUTS,
  CONTACT_LAYOUTS,
  CTA_EMPHASES,
  CTA_SECTION_LAYOUTS,
  GRID_COLUMNS,
  HERO_HEIGHTS,
  HERO_LAYOUTS,
  PRODUCT_GRID_LAYOUTS,
  RICH_TEXT_WIDTHS,
  SECTION_ALIGNS,
  SECTION_BACKGROUNDS,
  SECTION_CONTAINERS,
  SECTION_PADDINGS,
  zEnum,
} from './enums.js';
import { productCardStyleSchema } from './theme.js';
import { LIMITS, optionalText, text, uuid } from './primitives.js';
import { linkTargetInputSchema, linkTargetSchema } from './targets.js';

const richTextBody = z.string().trim().min(1).max(LIMITS.richTextBody);

export const sectionLayoutSchema = z.object({
  background: zEnum(SECTION_BACKGROUNDS),
  container: zEnum(SECTION_CONTAINERS),
  paddingY: zEnum(SECTION_PADDINGS),
  align: zEnum(SECTION_ALIGNS),
});
export type SectionLayout = z.infer<typeof sectionLayoutSchema>;

const gridColumns = z
  .number()
  .int()
  .refine(
    (n): n is (typeof GRID_COLUMNS)[number] => (GRID_COLUMNS as readonly number[]).includes(n),
    {
      message: `columns must be one of ${GRID_COLUMNS.join(', ')}`,
    },
  );

// ── Content field groups (shared by input & normalized) ─────────────────────
const heroContent = {
  headline: text(LIMITS.headline),
  subheadline: optionalText(LIMITS.subheadline),
  description: text(LIMITS.description),
  heroLayout: zEnum(HERO_LAYOUTS),
  height: zEnum(HERO_HEIGHTS),
  overlayStrength: z.number().int().min(0).max(3),
};
const categoriesContent = {
  title: optionalText(LIMITS.headline),
  categoriesLayout: zEnum(CATEGORIES_LAYOUTS),
  columns: gridColumns,
};
const productGridContent = {
  title: optionalText(LIMITS.headline),
  productGridLayout: zEnum(PRODUCT_GRID_LAYOUTS),
  columns: gridColumns,
  limit: z.number().int().min(1).max(24).optional(),
  cardVariant: productCardStyleSchema.partial().optional(),
  showViewAll: z.boolean(),
};
const richTextContent = {
  title: optionalText(LIMITS.headline),
  body: richTextBody,
  width: zEnum(RICH_TEXT_WIDTHS),
};
const contactContent = {
  title: optionalText(LIMITS.headline),
  description: optionalText(LIMITS.description),
  email: z.string().trim().email().max(LIMITS.shortText).optional(),
  phone: optionalText(40),
  address: optionalText(LIMITS.address),
  showForm: z.boolean(),
  contactLayout: zEnum(CONTACT_LAYOUTS),
};
const ctaContent = {
  headline: text(LIMITS.headline),
  description: optionalText(LIMITS.description),
  ctaLayout: zEnum(CTA_SECTION_LAYOUTS),
  emphasis: zEnum(CTA_EMPHASES),
};

const withBase = <T extends string, S extends z.ZodRawShape>(type: T, shape: S) =>
  z.object({
    id: uuid,
    type: z.literal(type),
    order: z.number().int().min(0),
    layout: sectionLayoutSchema,
    ...shape,
  });

const withInputBase = <T extends string, S extends z.ZodRawShape>(type: T, shape: S) =>
  z.object({
    type: z.literal(type),
    layout: sectionLayoutSchema.partial().optional(),
    ...shape,
  });

// ── Normalized section members ─────────────────────────────────────────────
export const heroSectionSchema = withBase('hero', {
  ...heroContent,
  cta: z.object({ label: text(LIMITS.label), target: linkTargetSchema }),
});
export const categoriesSectionSchema = withBase('categories', {
  ...categoriesContent,
  categoryIds: z.array(uuid).min(1).max(8),
});
export const productGridSectionSchema = withBase('productGrid', {
  ...productGridContent,
  categoryId: uuid.optional(),
  productIds: z.array(uuid).max(24).optional(),
});
export const richTextSectionSchema = withBase('richText', richTextContent);
export const contactSectionSchema = withBase('contact', contactContent);
export const ctaSectionSchema = withBase('cta', {
  ...ctaContent,
  button: z.object({ label: text(LIMITS.label), target: linkTargetSchema }),
});

export const sectionSchema = z.discriminatedUnion('type', [
  heroSectionSchema,
  categoriesSectionSchema,
  productGridSectionSchema,
  richTextSectionSchema,
  contactSectionSchema,
  ctaSectionSchema,
]);
export type Section = z.infer<typeof sectionSchema>;

// ── Input section members ─────────────────────────────────────────────────
export const heroSectionInputSchema = withInputBase('hero', {
  ...heroContent,
  cta: z.object({ label: text(LIMITS.label), target: linkTargetInputSchema }),
});
export const categoriesSectionInputSchema = withInputBase('categories', {
  ...categoriesContent,
  categorySlugs: z.array(z.string()).min(1).max(8),
});
export const productGridSectionInputSchema = withInputBase('productGrid', {
  ...productGridContent,
  categorySlug: z.string().optional(),
  productSlugs: z.array(z.string()).max(24).optional(),
});
export const richTextSectionInputSchema = withInputBase('richText', richTextContent);
export const contactSectionInputSchema = withInputBase('contact', contactContent);
export const ctaSectionInputSchema = withInputBase('cta', {
  ...ctaContent,
  button: z.object({ label: text(LIMITS.label), target: linkTargetInputSchema }),
});

export const sectionInputSchema = z.discriminatedUnion('type', [
  heroSectionInputSchema,
  categoriesSectionInputSchema,
  productGridSectionInputSchema,
  richTextSectionInputSchema,
  contactSectionInputSchema,
  ctaSectionInputSchema,
]);
export type SectionInput = z.infer<typeof sectionInputSchema>;
