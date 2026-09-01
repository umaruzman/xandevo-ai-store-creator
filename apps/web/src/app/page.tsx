import Link from 'next/link';

import { Button } from '@/components/ui/button';

const STEPS = [
  {
    title: 'Describe it',
    body: 'Write one sentence about the store you want — the niche, the audience, the country.',
  },
  {
    title: 'Generate',
    body: 'Xandevo turns it into a full storefront: theme, hero, categories, priced products, About & Contact.',
  },
  {
    title: 'Edit & save',
    body: 'Tweak copy, colours and layout inline with a live preview, then save it to your account.',
  },
];

const FEATURES = [
  [
    'Structured, not scraped',
    'Every store is a validated Store Definition — no AI-generated code, ever.',
  ],
  [
    'Provider-agnostic',
    'The generation engine runs on Anthropic, OpenAI or Gemini behind one interface.',
  ],
  [
    'Live preview',
    'A schema-driven renderer updates as you type — theme presets, section layouts, product grids.',
  ],
  ['Yours to keep', 'Stores persist to your account; reopen any time to keep editing.'],
];

export default function HomePage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16 sm:py-24">
      <section className="space-y-6">
        <p className="text-muted-foreground text-sm font-medium uppercase tracking-wide">
          Xandevo · AI Store Builder
        </p>
        <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
          Describe a store. Get a real storefront.
        </h1>
        <p className="text-muted-foreground max-w-xl text-lg">
          Natural language in, a complete, editable, savable e-commerce storefront out — theme,
          copy, categories and products included.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link href="/dashboard">Get started</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/sign-in">Sign in</Link>
          </Button>
        </div>
      </section>

      <section aria-labelledby="how" className="mt-20">
        <h2 id="how" className="text-lg font-semibold">
          How it works
        </h2>
        <ol className="mt-4 grid gap-4 sm:grid-cols-3">
          {STEPS.map((s, i) => (
            <li key={s.title} className="rounded-lg border p-4">
              <span className="text-muted-foreground text-xs font-medium">Step {i + 1}</span>
              <p className="mt-1 font-medium">{s.title}</p>
              <p className="text-muted-foreground mt-1 text-sm">{s.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="features" className="mt-16">
        <h2 id="features" className="text-lg font-semibold">
          What makes it different
        </h2>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          {FEATURES.map(([title, body]) => (
            <div key={title} className="rounded-lg border p-4">
              <dt className="font-medium">{title}</dt>
              <dd className="text-muted-foreground mt-1 text-sm">{body}</dd>
            </div>
          ))}
        </dl>
      </section>

      <footer className="text-muted-foreground mt-20 border-t pt-6 text-xs">
        Xandevo — AI Store Builder by Umar Uzman.
      </footer>
    </main>
  );
}
