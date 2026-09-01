import { z } from 'zod';

import { ANNOUNCEMENT_TONES, HEADER_VARIANTS, SOCIAL_PLATFORMS, zEnum } from './enums.js';
import { LIMITS, text } from './primitives.js';
import { linkTargetInputSchema, linkTargetSchema } from './targets.js';

const navLink = <T extends z.ZodTypeAny>(target: T) =>
  z.object({ label: text(LIMITS.label), target });

export const navigationInputSchema = z.object({
  links: z.array(navLink(linkTargetInputSchema)).max(8),
});
export const navigationSchema = z.object({
  links: z.array(navLink(linkTargetSchema)).max(8),
});

export const headerSchema = z.object({
  variant: zEnum(HEADER_VARIANTS),
  sticky: z.boolean(),
  transparentOverHero: z.boolean(),
});

const footerSocial = z.object({
  platform: zEnum(SOCIAL_PLATFORMS),
  handle: text(LIMITS.handle),
});

const footerColumn = <T extends z.ZodTypeAny>(target: T) =>
  z.object({
    title: text(LIMITS.label),
    links: z.array(navLink(target)).max(8),
  });

export const footerInputSchema = z.object({
  columns: z.array(footerColumn(linkTargetInputSchema)).max(4),
  social: z.array(footerSocial).max(7).optional(),
  showPaymentIcons: z.boolean(),
  showNewsletter: z.boolean(),
});
export const footerSchema = z.object({
  columns: z.array(footerColumn(linkTargetSchema)).max(4),
  social: z.array(footerSocial).max(7).optional(),
  showPaymentIcons: z.boolean(),
  showNewsletter: z.boolean(),
});

export const announcementBarInputSchema = z.object({
  text: text(LIMITS.shortText),
  link: linkTargetInputSchema.optional(),
  tone: zEnum(ANNOUNCEMENT_TONES),
  dismissible: z.boolean(),
});
export const announcementBarSchema = z.object({
  text: text(LIMITS.shortText),
  link: linkTargetSchema.optional(),
  tone: zEnum(ANNOUNCEMENT_TONES),
  dismissible: z.boolean(),
});

export type Navigation = z.infer<typeof navigationSchema>;
export type Header = z.infer<typeof headerSchema>;
export type Footer = z.infer<typeof footerSchema>;
export type AnnouncementBar = z.infer<typeof announcementBarSchema>;
