'use client';

import type { Category, LinkTarget, Product, StoreDefinition, Theme } from '@xandevo/shared';
import { createContext, useContext, useMemo, type ReactNode } from 'react';

interface RendererValue {
  theme: Theme;
  categoryById: Map<string, Category>;
  productById: Map<string, Product>;
  /** Resolve a structured link target to an in-preview href (no navigation in Phase 7). */
  href: (target: LinkTarget) => string | undefined;
}

const RendererContext = createContext<RendererValue | null>(null);

/**
 * Provides theme + catalogue lookups, memoized on the pieces that are stable
 * across a section content edit (`theme`, `categories`, `products`) — NOT the
 * whole `definition`. So editing one section's text leaves this context
 * referentially identical, and only that section's `React.memo` wrapper
 * re-renders. A theme or catalogue edit invalidates it and repaints (intended).
 */
export function RendererProvider({
  definition,
  children,
}: {
  definition: StoreDefinition;
  children: ReactNode;
}) {
  const { theme, categories, products, pages } = definition;

  const value = useMemo<RendererValue>(() => {
    const categoryById = new Map(categories.map((c) => [c.id, c]));
    const productById = new Map(products.map((p) => [p.id, p]));
    // Page slugs do not change on section content edits, so keeping `pages` out
    // of the deps below is safe and keeps the context stable.
    const pageSlugById = new Map(pages.map((p) => [p.id, p.slug]));
    return {
      theme,
      categoryById,
      productById,
      href: (target) => {
        switch (target.type) {
          case 'page':
            return `#${pageSlugById.get(target.pageId) ?? ''}`;
          case 'section':
            return `#${target.sectionId}`;
          case 'external':
            return target.url;
          case 'none':
            return undefined;
        }
      },
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `pages` intentionally excluded (see above)
  }, [theme, categories, products]);

  return <RendererContext.Provider value={value}>{children}</RendererContext.Provider>;
}

export function useRenderer(): RendererValue {
  const ctx = useContext(RendererContext);
  if (!ctx) throw new Error('useRenderer must be used within <RendererProvider>');
  return ctx;
}
