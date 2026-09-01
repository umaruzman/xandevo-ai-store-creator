import { CAPABILITIES } from './content';

export function Capabilities() {
  const [lead, ...rest] = CAPABILITIES;
  return (
    <section id="capabilities" className="bg-[color:var(--lp-bg-deep)]">
      <div className="mx-auto w-full max-w-6xl px-5 py-20 sm:px-8">
        <h2 className="lp-display max-w-2xl text-3xl text-[color:var(--lp-ink)] sm:text-4xl">
          An AI commerce platform, not a template gallery
        </h2>

        <div className="mt-12 grid gap-4 lg:grid-cols-3">
          <article className="min-w-0 self-start rounded-2xl bg-[color:var(--lp-forest)] p-8 text-[color:var(--lp-surface)]">
            <h3 className="lp-display text-xl">{lead.title}</h3>
            <p className="mt-3 text-sm leading-relaxed opacity-80">{lead.body}</p>
          </article>

          <div className="grid min-w-0 gap-4 sm:grid-cols-2 lg:col-span-2">
            {rest.map((cap) => (
              <article
                key={cap.title}
                className="min-w-0 rounded-2xl border border-[color:var(--lp-line)] bg-[color:var(--lp-surface)] p-7"
              >
                <h3 className="lp-display text-lg text-[color:var(--lp-ink)]">{cap.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[color:var(--lp-ink-soft)]">
                  {cap.body}
                </p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
