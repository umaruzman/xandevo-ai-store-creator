'use client';

import type { Section, StoreDefinition } from '@xandevo/shared';
import type { ComponentType } from 'react';

import { cn } from '@/lib/utils';

import { AnnouncementBar } from './chrome/announcement-bar';
import { SiteFooter } from './chrome/site-footer';
import { SiteHeader } from './chrome/site-header';
import { RendererProvider } from './renderer-context';
import { SectionSlot } from './sections/section-registry';
import { resolveThemeVars } from './theme-vars';

type SectionComponent = ComponentType<{ section: never }>;

/**
 * Pure `StoreDefinition -> JSX`. Sets `--sf-*` theme vars on the storefront root,
 * renders announcement bar + header + the given page's ordered sections + footer.
 * Unknown section types and enum values fall back safely (never throws). No
 * `dangerouslySetInnerHTML` anywhere.
 */
export function StoreRenderer({
  definition,
  pageSlug = 'home',
  registry,
  className,
}: {
  definition: StoreDefinition;
  pageSlug?: string;
  registry?: Partial<Record<string, SectionComponent>>;
  className?: string;
}) {
  const page =
    definition.pages.find((p) => p.slug === pageSlug) ??
    [...definition.pages].sort((a, b) => a.order - b.order)[0];

  const sections: Section[] = page ? [...page.sections].sort((a, b) => a.order - b.order) : [];

  return (
    <RendererProvider definition={definition}>
      <div
        data-sf-root
        style={resolveThemeVars(definition.theme)}
        className={cn(
          'font-[family-name:var(--sf-font-body)] leading-[var(--sf-line-height)]',
          'bg-[var(--sf-background)] text-[var(--sf-text)]',
          className,
        )}
      >
        {definition.announcementBar ? <AnnouncementBar data={definition.announcementBar} /> : null}
        <SiteHeader
          storeName={definition.meta.name}
          header={definition.header}
          navigation={definition.navigation}
        />
        <main>
          {sections.map((section) => (
            <SectionSlot key={section.id} section={section} registry={registry} />
          ))}
        </main>
        <SiteFooter storeName={definition.meta.name} footer={definition.footer} />
      </div>
    </RendererProvider>
  );
}
