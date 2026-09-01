'use client';

import type { Product, ProductCardStyle } from '@xandevo/shared';
import { memo } from 'react';

import { cn } from '@/lib/utils';

import { placeholderImage } from '../placeholder-image';
import {
  pick,
  PRODUCT_CARD_FRAME,
  PRODUCT_CARD_HOVER,
  PRODUCT_CARD_IMAGE_RATIO,
  PRODUCT_CARD_VARIANT,
} from '../recipes';

function formatPrice(minor: number, currency: string): string {
  try {
    return new Intl.NumberFormat('en', {
      style: 'currency',
      currency,
      maximumFractionDigits: minor % 100 === 0 ? 0 : 2,
    }).format(minor / 100);
  } catch {
    return `${(minor / 100).toFixed(2)} ${currency}`;
  }
}

export const ProductCard = memo(function ProductCard({
  product,
  style,
}: {
  product: Product;
  style: ProductCardStyle;
}) {
  const src =
    product.image.kind === 'placeholder'
      ? placeholderImage(product.image.seed, product.name)
      : product.image.url;
  const price = formatPrice(product.priceMinor, product.currency);
  const isOverlay = style.variant === 'overlay';
  const badge = style.showBadges && product.badge ? product.badge : null;

  return (
    <article
      className={cn(
        'group',
        pick(PRODUCT_CARD_VARIANT, style.variant, 'standard'),
        pick(PRODUCT_CARD_FRAME, style.frame, 'none'),
        pick(PRODUCT_CARD_HOVER, style.hover, 'lift'),
      )}
    >
      <div className="relative overflow-hidden rounded-[var(--sf-radius)]">
        {/* eslint-disable-next-line @next/next/no-img-element -- data-URI / offline preview */}
        <img
          src={src}
          alt={product.name}
          loading="lazy"
          className={cn(
            'w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]',
            pick(PRODUCT_CARD_IMAGE_RATIO, style.imageRatio, 'square'),
          )}
        />
        <span className="pointer-events-none absolute inset-0 rounded-[var(--sf-radius)] ring-1 ring-inset ring-black/5" />
        {badge ? (
          <span className="absolute left-2 top-2 rounded-full bg-[var(--sf-accent)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--sf-primary-contrast)]">
            {badge}
          </span>
        ) : null}
        {isOverlay ? (
          <span className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/70 to-transparent" />
        ) : null}

        {isOverlay ? (
          <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-3 text-white">
            <span className="text-sm font-medium">{product.name}</span>
            <span className="text-sm opacity-90">{price}</span>
          </div>
        ) : null}
      </div>

      {!isOverlay ? (
        <div className="mt-2.5 flex items-baseline justify-between gap-3">
          <span className="text-sm font-medium sm:text-[0.95rem]">{product.name}</span>
          <span className="shrink-0 text-sm tabular-nums opacity-70">{price}</span>
        </div>
      ) : null}
    </article>
  );
});
