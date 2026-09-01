import Link from 'next/link';

import { StoreRenderer } from '@/components/renderer/store-renderer';

import { HERO_PROMPT, SAMPLE_STORE_DEFINITION } from './sample-store';

export function LandingHero() {
  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-5 pb-16 pt-16 sm:px-8 lg:grid-cols-[0.92fr_1.08fr] lg:gap-16 lg:pb-24 lg:pt-20">
        <div className="min-w-0">
          <p className="lp-eyebrow lp-rise lp-rise-1 text-[0.7rem] text-[color:var(--lp-accent)]">
            AI Store Builder · Built for the Gulf
          </p>
          <h1 className="lp-display lp-rise lp-rise-2 mt-4 text-4xl leading-[1.05] text-[color:var(--lp-ink)] md:text-5xl lg:text-6xl">
            One sentence in. A real storefront out.
          </h1>
          <p className="lp-rise lp-rise-3 mt-5 max-w-md text-lg leading-relaxed text-[color:var(--lp-ink-soft)]">
            Describe the shop you want. Xandevo writes the theme, hero, categories, priced products
            and pages — editable, and saved to your account.
          </p>

          <div className="lp-rise lp-rise-3 mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/dashboard"
              className="rounded-full bg-[color:var(--lp-forest)] px-6 py-3 text-sm font-semibold text-[color:var(--lp-surface)] transition-transform hover:-translate-y-0.5"
            >
              Create your store
            </Link>
            <Link
              href="/sign-in"
              className="border-[color:var(--lp-ink)]/25 hover:border-[color:var(--lp-ink)]/60 rounded-full border px-6 py-3 text-sm font-semibold text-[color:var(--lp-ink)] transition-colors"
            >
              Sign in
            </Link>
          </div>

          <figure className="lp-rise lp-rise-4 mt-10 rounded-2xl border border-[color:var(--lp-line)] bg-[color:var(--lp-surface)] p-4">
            <figcaption className="flex items-center gap-2 text-[0.7rem] font-medium uppercase tracking-[0.16em] text-[color:var(--lp-ink-soft)]">
              <span className="size-1.5 rounded-full bg-[color:var(--lp-accent)]" />
              Your prompt
            </figcaption>
            <p className="mt-2 text-sm leading-relaxed text-[color:var(--lp-ink)]">
              &ldquo;{HERO_PROMPT}&rdquo;
            </p>
          </figure>
        </div>

        <div className="lp-rise lp-rise-3 min-w-0">
          <BrowserFrame url="bayt-al-oud.xandevo.store">
            <div className="pointer-events-none h-[440px] select-none overflow-hidden sm:h-[540px]">
              <div className="w-[135%] origin-top-left scale-[0.74]">
                <StoreRenderer definition={SAMPLE_STORE_DEFINITION} />
              </div>
            </div>
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-[color:var(--lp-surface)] to-transparent" />
          </BrowserFrame>
          <p className="mt-3 text-center text-xs text-[color:var(--lp-ink-soft)]">
            A live render — the same engine that ships the store
          </p>
        </div>
      </div>
    </section>
  );
}

function BrowserFrame({ url, children }: { url: string; children: React.ReactNode }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-[color:var(--lp-line)] bg-[color:var(--lp-surface)] shadow-[0_28px_70px_-36px_rgba(23,33,28,0.5)]">
      <div className="flex items-center gap-3 border-b border-[color:var(--lp-line)] px-4 py-2.5">
        <span className="flex gap-1.5">
          <span className="size-2.5 rounded-full bg-[color:var(--lp-line)]" />
          <span className="size-2.5 rounded-full bg-[color:var(--lp-line)]" />
          <span className="size-2.5 rounded-full bg-[color:var(--lp-line)]" />
        </span>
        <span className="mx-auto rounded-md bg-[color:var(--lp-bg)] px-3 py-1 text-xs text-[color:var(--lp-ink-soft)]">
          {url}
        </span>
      </div>
      <div className="relative">{children}</div>
    </div>
  );
}
