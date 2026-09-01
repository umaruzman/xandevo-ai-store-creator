import { STEPS } from './content';

export function HowItWorks() {
  return (
    <section id="how" className="border-t border-[color:var(--lp-line)]">
      <div className="mx-auto w-full max-w-6xl px-5 py-20 sm:px-8">
        <h2 className="lp-display max-w-md text-3xl text-[color:var(--lp-ink)] sm:text-4xl">
          From a sentence to a storefront
        </h2>

        <ol className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-[color:var(--lp-line)] bg-[color:var(--lp-line)] md:grid-cols-3">
          {STEPS.map((step) => (
            <li key={step.n} className="bg-[color:var(--lp-bg)] p-7">
              <span className="lp-display text-4xl text-[color:var(--lp-accent)]">{step.n}</span>
              <p className="lp-display mt-4 text-xl text-[color:var(--lp-ink)]">{step.title}</p>
              <p className="mt-2 text-sm leading-relaxed text-[color:var(--lp-ink-soft)]">
                {step.body}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
