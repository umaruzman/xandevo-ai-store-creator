'use client';

import type { Footer } from '@xandevo/shared';
import { memo } from 'react';

import { useRenderer } from '../renderer-context';

export const SiteFooter = memo(function SiteFooter({
  storeName,
  footer,
}: {
  storeName: string;
  footer: Footer;
}) {
  const { href } = useRenderer();
  return (
    <footer className="border-t border-[var(--sf-border)] bg-[var(--sf-muted-bg)] px-4 py-10 text-sm sm:px-6">
      <div className="mx-auto grid max-w-[var(--sf-container)] gap-6 sm:grid-cols-2 md:grid-cols-4">
        {footer.columns.map((col, ci) => (
          <div key={ci}>
            <p className="mb-2 font-medium">{col.title}</p>
            <ul className="space-y-1 opacity-70">
              {col.links.map((link, li) => (
                <li key={li}>
                  <a href={href(link.target)}>{link.label}</a>
                </li>
              ))}
            </ul>
          </div>
        ))}
        {footer.social && footer.social.length > 0 ? (
          <div>
            <p className="mb-2 font-medium">Social</p>
            <ul className="space-y-1 opacity-70">
              {footer.social.map((s, i) => (
                <li key={i}>
                  {s.platform}: @{s.handle}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
      <p className="mx-auto mt-8 max-w-[var(--sf-container)] opacity-60">
        © {new Date().getFullYear()} {storeName}
        {footer.showPaymentIcons ? ' · Visa · Mastercard · Apple Pay' : ''}
        {footer.showNewsletter ? ' · Newsletter' : ''}
      </p>
    </footer>
  );
});
