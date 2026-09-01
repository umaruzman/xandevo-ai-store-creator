'use client';

import type { Header, Navigation } from '@xandevo/shared';
import { memo } from 'react';

import { cn } from '@/lib/utils';

import { useRenderer } from '../renderer-context';
import { HEADER_VARIANT, pick } from '../recipes';

export const SiteHeader = memo(function SiteHeader({
  storeName,
  header,
  navigation,
}: {
  storeName: string;
  header: Header;
  navigation: Navigation;
}) {
  const { href } = useRenderer();
  return (
    <header
      className={cn(
        'bg-[var(--sf-background)]/90 z-20 border-b border-[var(--sf-border)] px-4 py-4 backdrop-blur-sm sm:px-6',
        header.sticky && 'sticky top-0',
        pick(HEADER_VARIANT, header.variant, 'minimal'),
      )}
    >
      <span
        className="text-lg tracking-tight"
        style={{ fontFamily: 'var(--sf-font-heading)', fontWeight: 'var(--sf-heading-weight)' }}
      >
        {storeName}
      </span>
      <nav className="flex flex-wrap items-center gap-5 text-sm">
        {navigation.links.map((link, i) => (
          <a
            key={i}
            href={href(link.target)}
            className="relative opacity-70 transition-opacity hover:opacity-100"
          >
            {link.label}
          </a>
        ))}
        {header.variant === 'with-search' ? (
          <span className="opacity-50" aria-hidden>
            ⌕
          </span>
        ) : null}
      </nav>
    </header>
  );
});
