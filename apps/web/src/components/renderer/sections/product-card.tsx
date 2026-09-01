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
    return new Intl.NumberFormat('en', { style: 'currency', currency }).format(minor / 100);
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
  const cardRadius = style.radius === 'inherit' ? undefined : style.radius;
  const price = formatPrice(product.priceMinor, product.currency);

  return (
    <article
      className={cn(
        pick(PRODUCT_CARD_VARIANT, style.variant, 'standard'),
        pick(PRODUCT_CARD_FRAME, style.frame, 'none'),
        pick(PRODUCT_CARD_HOVER, style.hover, 'none'),
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- data-URI / offline preview */}
      <img
        src={src}
        alt={product.name}
        loading="lazy"
        className={cn(
          'w-full object-cover',
          pick(PRODUCT_CARD_IMAGE_RATIO, style.imageRatio, 'square'),
        )}
        style={cardRadius ? { borderRadius: `var(--sf-radius)` } : undefined}
      />
      <div className={cn('flex flex-col gap-0.5', style.variant === 'overlay' && 'p-3')}>
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-sm font-medium">{product.name}</span>
          {style.pricePlacement === 'beside-title' ? (
            <span className="text-sm opacity-70">{price}</span>
          ) : null}
        </div>
        {style.pricePlacement !== 'beside-title' ? (
          <span className="text-sm opacity-70">{price}</span>
        ) : null}
        {style.showBadges && product.badge ? (
          <span className="mt-1 w-fit rounded-full border px-2 py-0.5 text-[10px] uppercase">
            {product.badge}
          </span>
        ) : null}
      </div>
    </article>
  );
});
