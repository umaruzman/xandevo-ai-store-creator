'use client';

import type { ButtonStyle } from '@xandevo/shared';
import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

import { BUTTON_SIZE, BUTTON_VARIANT, pick } from './recipes';

const HEADING_STYLE = {
  fontFamily: 'var(--sf-font-heading)',
  fontWeight: 'var(--sf-heading-weight)',
  letterSpacing: 'var(--sf-letter-spacing)',
} as const;

/** A storefront button/link styled from `theme.components.button`. */
export function StoreButton({
  href,
  children,
  style,
  className,
}: {
  href?: string;
  children: ReactNode;
  style: ButtonStyle;
  className?: string;
}) {
  const classes = cn(
    'inline-flex items-center justify-center rounded-[var(--sf-button-radius)] font-medium transition-colors',
    pick(BUTTON_VARIANT, style.variant, 'solid'),
    pick(BUTTON_SIZE, style.size, 'md'),
    className,
  );
  return href ? (
    <a href={href} className={classes}>
      {children}
    </a>
  ) : (
    <span className={classes}>{children}</span>
  );
}

export function Heading({
  level = 2,
  children,
  className,
}: {
  level?: 1 | 2 | 3;
  children: ReactNode;
  className?: string;
}) {
  const Tag = `h${level}` as 'h1' | 'h2' | 'h3';
  return (
    <Tag
      style={level === 1 ? { ...HEADING_STYLE, letterSpacing: '-0.02em' } : HEADING_STYLE}
      className={cn(
        level === 1 && 'text-4xl leading-[1.05] sm:text-5xl lg:text-6xl',
        level === 2 && 'text-2xl sm:text-3xl',
        level === 3 && 'text-lg',
        className,
      )}
    >
      {children}
    </Tag>
  );
}
