'use client';

import type { Section } from '@xandevo/shared';
import { memo } from 'react';

import { cn } from '@/lib/utils';

import { useRenderer } from '../renderer-context';
import { CATEGORIES_LAYOUT, CATEGORY_CARD_VARIANT, GRID_COLUMNS, pick } from '../recipes';
import { Heading } from '../sf-ui';
import { SectionShell } from './section-shell';

type CategoriesSection = Extract<Section, { type: 'categories' }>;

export const CategoriesSection = memo(function CategoriesSection({
  section,
}: {
  section: CategoriesSection;
}) {
  const { categoryById, theme } = useRenderer();
  const categories = section.categoryIds
    .map((id) => categoryById.get(id))
    .filter((c): c is NonNullable<typeof c> => Boolean(c));
  const isGrid = section.categoriesLayout === 'grid';
  const cardVariant = theme.components.categoryCard.variant;

  return (
    <SectionShell id={section.id} layout={section.layout}>
      {section.title ? <Heading level={2}>{section.title}</Heading> : null}
      <ul
        className={cn(
          pick(CATEGORIES_LAYOUT, section.categoriesLayout, 'grid'),
          isGrid && pick(GRID_COLUMNS, String(section.columns), '3'),
        )}
      >
        {categories.map((c) => (
          <li key={c.id}>
            <span className={pick(CATEGORY_CARD_VARIANT, cardVariant, 'text-chip')}>{c.name}</span>
          </li>
        ))}
      </ul>
    </SectionShell>
  );
});
