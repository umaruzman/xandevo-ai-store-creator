'use client';

import { Button } from '@/components/ui/button';
import { useBuilderStore } from '@/lib/store/builder';

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border p-2">
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd className="font-medium capitalize">{value}</dd>
    </div>
  );
}

export function GeneratedSummary({ onStartOver }: { onStartOver: () => void }) {
  const definition = useBuilderStore((s) => s.definition);
  const promptVersion = useBuilderStore((s) => s.promptVersion);
  if (!definition) return null;

  const { meta, theme, pages, categories, products } = definition;
  const price = (minor: number) => {
    try {
      return new Intl.NumberFormat(meta.locale || 'en', {
        style: 'currency',
        currency: meta.currency,
      }).format(minor / 100);
    } catch {
      return `${(minor / 100).toFixed(2)} ${meta.currency}`;
    }
  };

  return (
    <div className="space-y-6" data-testid="generated-summary">
      <div>
        <h2 className="text-xl font-semibold">{meta.name}</h2>
        {meta.tagline ? <p className="text-muted-foreground text-sm">{meta.tagline}</p> : null}
      </div>

      <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
        <Stat label="Theme" value={theme.preset} />
        <Stat label="Pages" value={String(pages.length)} />
        <Stat label="Categories" value={String(categories.length)} />
        <Stat label="Products" value={String(products.length)} />
      </dl>

      <div>
        <h3 className="mb-2 text-sm font-medium">Categories</h3>
        <ul className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <li key={c.id} className="rounded-full border px-2.5 py-0.5 text-xs">
              {c.name}
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-medium">Sample products</h3>
        <ul className="text-sm">
          {products.slice(0, 5).map((p) => (
            <li key={p.id} className="flex justify-between border-b py-1">
              <span>{p.name}</span>
              <span className="text-muted-foreground">{price(p.priceMinor)}</span>
            </li>
          ))}
        </ul>
      </div>

      <p className="text-muted-foreground text-xs">
        Generated with prompt <code>{promptVersion}</code>. Live preview arrives in Phase 7, inline
        editing in Phase 8, and saving in Phase 9.
      </p>

      <div className="flex gap-2">
        <Button variant="outline" onClick={onStartOver}>
          Start over
        </Button>
        <Button disabled>Save store (Phase 9)</Button>
      </div>
    </div>
  );
}
