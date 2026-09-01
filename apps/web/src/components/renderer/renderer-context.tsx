'use client';

import type { Category, LinkTarget, Product, StoreDefinition, Theme } from '@xandevo/shared';
import { createContext, useContext, useMemo, type ReactNode } from 'react';

import type { Path } from '@/lib/set-path';

interface RendererValue {
  theme: Theme;
  categoryById: Map<string, Category>;
  productById: Map<string, Product>;
  /** Resolve a structured link target to an in-preview href. */
  href: (target: LinkTarget) => string | undefined;
  /** Inline editing: when `enabled`, rendered text becomes editable in place. */
  edit: { enabled: boolean; onText: (path: Path, value: string) => void };
}

const RendererContext = createContext<RendererValue | null>(null);

const noop = () => {};

/**
 * Provides theme + catalogue lookups, memoized on the pieces that are stable
 * across a section content edit (`theme`, `categories`, `products`, and the two
 * editing handles) — NOT the whole `definition`. So editing one section's text
 * leaves this context referentially identical, and only that section's
 * `React.memo` wrapper re-renders.
 */
export function RendererProvider({
  definition,
  editEnabled = false,
  onEditText,
  children,
}: {
  definition: StoreDefinition;
  editEnabled?: boolean;
  onEditText?: (path: Path, value: string) => void;
  children: ReactNode;
}) {
  const { theme, categories, products, pages } = definition;

  const value = useMemo<RendererValue>(() => {
    const categoryById = new Map(categories.map((c) => [c.id, c]));
    const productById = new Map(products.map((p) => [p.id, p]));
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
      edit: { enabled: editEnabled, onText: onEditText ?? noop },
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `pages` intentionally excluded (stable slugs)
  }, [theme, categories, products, editEnabled, onEditText]);

  return <RendererContext.Provider value={value}>{children}</RendererContext.Provider>;
}

export function useRenderer(): RendererValue {
  const ctx = useContext(RendererContext);
  if (!ctx) throw new Error('useRenderer must be used within <RendererProvider>');
  return ctx;
}
