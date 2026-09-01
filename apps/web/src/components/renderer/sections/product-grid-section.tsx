'use client';

import type { Product, Section } from '@xandevo/shared';
import { memo } from 'react';

import { cn } from '@/lib/utils';

import { useRenderer } from '../renderer-context';
import { GRID_COLUMNS, pick, PRODUCT_GRID_LAYOUT } from '../recipes';
import { Heading } from '../sf-ui';
import { ProductCard } from './product-card';
import { SectionShell } from './section-shell';

type ProductGridSection = Extract<Section, { type: 'productGrid' }>;

export const ProductGridSection = memo(function ProductGridSection({
  section,
}: {
  section: ProductGridSection;
}) {
  const { productById, theme } = useRenderer();
  const style = section.cardVariant
    ? { ...theme.components.productCard, ...section.cardVariant }
    : theme.components.productCard;

  const all: Product[] = section.productIds
    ? section.productIds
        .map((id) => productById.get(id))
        .filter((p): p is Product => p !== undefined)
    : [...productById.values()].filter(
        (p) => !section.categoryId || p.categoryId === section.categoryId,
      );
  const products = section.limit ? all.slice(0, section.limit) : all;

  const isGrid = section.productGridLayout === 'grid';

  return (
    <SectionShell id={section.id} layout={section.layout}>
      {section.title ? <Heading level={2}>{section.title}</Heading> : null}
      <div
        className={cn(
          pick(PRODUCT_GRID_LAYOUT, section.productGridLayout, 'grid'),
          isGrid && pick(GRID_COLUMNS, String(section.columns), '3'),
        )}
      >
        {products.map((p) => (
          <ProductCard key={p.id} product={p} style={style} />
        ))}
      </div>
      {section.showViewAll ? (
        <a href="#" className="text-sm underline opacity-70">
          View all
        </a>
      ) : null}
    </SectionShell>
  );
});
