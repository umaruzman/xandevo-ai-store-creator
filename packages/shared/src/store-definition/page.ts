import { z } from 'zod';

import { LIMITS, slug, text, uuid } from './primitives.js';
import { sectionInputSchema, sectionSchema } from './sections.js';

/** Pages every store must have. `home` is rendered first. */
export const REQUIRED_PAGE_SLUGS = ['home', 'about', 'contact'] as const;
export type RequiredPageSlug = (typeof REQUIRED_PAGE_SLUGS)[number];

export const pageInputSchema = z.object({
  slug,
  title: text(LIMITS.label),
  sections: z.array(sectionInputSchema).min(1).max(20),
});
export type PageInput = z.infer<typeof pageInputSchema>;

export const pageSchema = z.object({
  id: uuid,
  slug,
  title: text(LIMITS.label),
  order: z.number().int().min(0),
  sections: z.array(sectionSchema).min(1).max(20),
});
export type Page = z.infer<typeof pageSchema>;
