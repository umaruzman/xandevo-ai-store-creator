import Link from 'next/link';

export function LandingNav() {
  return (
    <header className="border-b border-[color:var(--lp-line)]">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-3 px-5 sm:px-8">
        <Link href="/" className="lp-display shrink-0 text-xl text-[color:var(--lp-ink)]">
          Xandevo
        </Link>

        <nav className="hidden items-center gap-8 text-sm md:flex">
          <a
            href="#how"
            className="text-[color:var(--lp-ink-soft)] hover:text-[color:var(--lp-ink)]"
          >
            How it works
          </a>
          <a
            href="#capabilities"
            className="text-[color:var(--lp-ink-soft)] hover:text-[color:var(--lp-ink)]"
          >
            Platform
          </a>
          <a
            href="#prompts"
            className="text-[color:var(--lp-ink-soft)] hover:text-[color:var(--lp-ink)]"
          >
            Examples
          </a>
        </nav>

        <div className="flex shrink-0 items-center gap-3 sm:gap-4">
          <Link
            href="/sign-in"
            className="hidden text-sm text-[color:var(--lp-ink-soft)] hover:text-[color:var(--lp-ink)] sm:inline"
          >
            Sign in
          </Link>
          <Link
            href="/dashboard"
            className="whitespace-nowrap rounded-full bg-[color:var(--lp-forest)] px-4 py-2 text-sm font-medium text-[color:var(--lp-surface)] transition-transform hover:-translate-y-0.5"
          >
            <span className="sm:hidden">Create store</span>
            <span className="hidden sm:inline">Create your store</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
