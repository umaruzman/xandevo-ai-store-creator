'use client';

import type { Section, StoreDefinition } from '@xandevo/shared';
import { useRef, type ComponentType } from 'react';

import type { Path } from '@/lib/set-path';
import { cn } from '@/lib/utils';

import { AnnouncementBar } from './chrome/announcement-bar';
import { SiteFooter } from './chrome/site-footer';
import { SiteHeader } from './chrome/site-header';
import { RendererProvider } from './renderer-context';
import { SectionSlot } from './sections/section-registry';
import { resolveThemeVars } from './theme-vars';

type SectionComponent = ComponentType<{ section: never; path?: Path }>;

/**
 * Pure `StoreDefinition -> JSX`. Sets `--sf-*` theme vars on the storefront root,
 * renders announcement bar + header + the given page's ordered sections + footer.
 * Unknown section types and enum values fall back safely (never throws). No
 * `dangerouslySetInnerHTML` anywhere. When `editable`, rendered text is editable
 * in place and edits are reported through `onEditText(path, value)`.
 */
export function StoreRenderer({
  definition,
  pageSlug = 'home',
  registry,
  className,
  editable = false,
  onEditText,
}: {
  definition: StoreDefinition;
  pageSlug?: string;
  registry?: Partial<Record<string, SectionComponent>>;
  className?: string;
  editable?: boolean;
  onEditText?: (path: Path, value: string) => void;
}) {
  const pageIndex = definition.pages.findIndex((p) => p.slug === pageSlug);
  const page =
    pageIndex >= 0
      ? definition.pages[pageIndex]
      : [...definition.pages].sort((a, b) => a.order - b.order)[0];
  const resolvedPageIndex = pageIndex >= 0 ? pageIndex : definition.pages.indexOf(page!);

  const ordered: Section[] = page ? [...page.sections].sort((a, b) => a.order - b.order) : [];

  // Stable per-section edit path: keyed on the section object identity, so an
  // unchanged section keeps the same `path` array across unrelated edits and its
  // `React.memo` boundary holds. An edited section is a new object → new path.
  const pathCache = useRef(new WeakMap<object, Path>());
  const pathFor = (section: Section): Path => {
    let p = pathCache.current.get(section);
    if (!p) {
      const storeIndex = page!.sections.findIndex((s) => s.id === section.id);
      p = ['pages', resolvedPageIndex, 'sections', storeIndex] as const;
      pathCache.current.set(section, p);
    }
    return p;
  };

  return (
    <RendererProvider definition={definition} editEnabled={editable} onEditText={onEditText}>
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
          {ordered.map((section) => (
            <SectionSlot
              key={section.id}
              section={section}
              path={pathFor(section)}
              registry={registry}
            />
          ))}
        </main>
        <SiteFooter storeName={definition.meta.name} footer={definition.footer} />
      </div>
    </RendererProvider>
  );
}
