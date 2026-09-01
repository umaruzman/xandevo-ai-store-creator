'use client';

import type { Section } from '@xandevo/shared';
import { memo } from 'react';

import { sectionPropsEqual } from './memo-compare';

import type { Path } from '@/lib/set-path';
import { cn } from '@/lib/utils';

import { EditableText } from '../editable-text';
import { placeholderImage } from '../placeholder-image';
import { useRenderer } from '../renderer-context';
import { CATEGORIES_LAYOUT, GRID_COLUMNS, pick } from '../recipes';
import { SectionShell } from './section-shell';

type CategoriesSection = Extract<Section, { type: 'categories' }>;

export const CategoriesSection = memo(function CategoriesSection({
  section,
  path = [],
}: {
  section: CategoriesSection;
  path?: Path;
}) {
  const { categoryById } = useRenderer();
  const categories = section.categoryIds
    .map((id) => categoryById.get(id))
    .filter((c): c is NonNullable<typeof c> => Boolean(c));
  const isGrid = section.categoriesLayout === 'grid';
  const isList = section.categoriesLayout === 'list';

  return (
    <SectionShell id={section.id} layout={section.layout}>
      {section.title ? (
        <EditableText heading={2} path={[...path, 'title']} value={section.title} />
      ) : null}
      <ul
        className={cn(
          pick(CATEGORIES_LAYOUT, section.categoriesLayout, 'grid'),
          isGrid && pick(GRID_COLUMNS, String(section.columns), '3'),
        )}
      >
        {categories.map((c) =>
          isList ? (
            <li key={c.id}>
              <a
                href={`#${c.slug}`}
                className="flex items-center justify-between py-3 text-sm transition-opacity hover:opacity-70"
              >
                <span className="font-medium">{c.name}</span>
                <span aria-hidden>→</span>
              </a>
            </li>
          ) : (
            <li key={c.id} className={cn(!isGrid && 'w-44 shrink-0')}>
              <a
                href={`#${c.slug}`}
                className="group relative block aspect-[4/5] overflow-hidden rounded-[var(--sf-radius)] border border-[var(--sf-border)]"
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- offline data-URI preview */}
                <img
                  src={placeholderImage(c.slug, c.name)}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <span className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/65 to-transparent" />
                <span className="absolute inset-x-0 bottom-0 p-3 text-sm font-medium text-white">
                  {c.name}
                </span>
              </a>
            </li>
          ),
        )}
      </ul>
    </SectionShell>
  );
}, sectionPropsEqual);
