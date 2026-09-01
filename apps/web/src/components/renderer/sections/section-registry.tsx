'use client';

import type { Section } from '@xandevo/shared';
import type { ComponentType } from 'react';

import { CategoriesSection } from './categories-section';
import { ContactSection } from './contact-section';
import { CtaSection } from './cta-section';
import { HeroSection } from './hero-section';
import { ProductGridSection } from './product-grid-section';
import { RichTextSection } from './rich-text-section';

type SectionComponent = ComponentType<{ section: never }>;

/** `section.type` → component. Unknown types are handled by `<SectionSlot>`. */
export const SECTION_REGISTRY: Record<Section['type'], SectionComponent> = {
  hero: HeroSection as SectionComponent,
  categories: CategoriesSection as SectionComponent,
  productGrid: ProductGridSection as SectionComponent,
  richText: RichTextSection as SectionComponent,
  contact: ContactSection as SectionComponent,
  cta: CtaSection as SectionComponent,
};

export function SectionSlot({
  section,
  registry = SECTION_REGISTRY,
}: {
  section: Section;
  registry?: Partial<Record<string, SectionComponent>>;
}) {
  const Component = registry[section.type];
  if (!Component) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`[StoreRenderer] no component for section type "${section.type}" — skipped`);
    }
    return null;
  }
  return <Component section={section as never} />;
}
