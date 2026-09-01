import Link from 'next/link';

export function ClosingCta() {
  return (
    <section className="bg-[color:var(--lp-forest)] text-[color:var(--lp-surface)]">
      <div className="mx-auto w-full max-w-6xl px-5 py-24 text-center sm:px-8">
        <h2 className="lp-display mx-auto max-w-2xl text-3xl leading-tight sm:text-5xl">
          Your next store is one sentence away
        </h2>
        <p className="mx-auto mt-5 max-w-lg text-sm opacity-80">
          Sign in with Google and generate your first storefront in under a minute.
        </p>
        <Link
          href="/dashboard"
          className="mt-9 inline-block rounded-full bg-[color:var(--lp-surface)] px-7 py-3 text-sm font-semibold text-[color:var(--lp-forest)] transition-transform hover:-translate-y-0.5"
        >
          Create your store
        </Link>
      </div>
    </section>
  );
}
