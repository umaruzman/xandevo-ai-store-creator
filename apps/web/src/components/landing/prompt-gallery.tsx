import Link from 'next/link';

import { SAMPLE_PROMPTS } from './content';

export function PromptGallery() {
  return (
    <section id="prompts" className="border-t border-[color:var(--lp-line)]">
      <div className="mx-auto w-full max-w-6xl px-5 py-20 sm:px-8">
        <h2 className="lp-display max-w-lg text-3xl text-[color:var(--lp-ink)] sm:text-4xl">
          Start from a prompt like these
        </h2>
        <p className="mt-3 max-w-md text-sm text-[color:var(--lp-ink-soft)]">
          Each one produces a themed storefront with eight priced products and its own About and
          Contact pages.
        </p>

        <ul className="mt-10 space-y-3">
          {SAMPLE_PROMPTS.map((prompt) => (
            <li key={prompt}>
              <Link
                href="/dashboard"
                className="group flex items-center gap-4 rounded-xl border border-[color:var(--lp-line)] bg-[color:var(--lp-surface)] px-5 py-4 transition-colors hover:border-[color:var(--lp-accent)]"
              >
                <span className="lp-display shrink-0 text-lg text-[color:var(--lp-accent)]">
                  &ldquo;
                </span>
                <span className="text-sm text-[color:var(--lp-ink)] sm:text-base">{prompt}</span>
                <span className="ml-auto shrink-0 text-sm text-[color:var(--lp-ink-soft)] group-hover:text-[color:var(--lp-ink)]">
                  Generate →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
