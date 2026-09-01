import { z } from 'zod';

import { externalUrl, slug, uuid } from './primitives.js';

/**
 * Link targets are structured — never a raw href.
 *
 * INPUT form (from the AI): page targets reference a page `slug`; section targets
 * are not expressible (the model has no section ids). NORMALIZED form: page/section
 * targets reference a resolved `pageId` / `sectionId`.
 */

export const linkTargetInputSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('page'), slug }),
  z.object({ type: z.literal('external'), url: externalUrl }),
  z.object({ type: z.literal('none') }),
]);

export const linkTargetSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('page'), pageId: uuid }),
  z.object({ type: z.literal('section'), sectionId: uuid }),
  z.object({ type: z.literal('external'), url: externalUrl }),
  z.object({ type: z.literal('none') }),
]);

export type LinkTargetInput = z.infer<typeof linkTargetInputSchema>;
export type LinkTarget = z.infer<typeof linkTargetSchema>;
