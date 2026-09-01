'use client';

import { useState } from 'react';

import { StoreRenderer } from '@/components/renderer/store-renderer';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useBuilderStore } from '@/lib/store/builder';

type Device = 'desktop' | 'mobile';

/**
 * Preview chrome (device toggle, actions) wrapping the schema-driven
 * `<StoreRenderer>`. Reads the working definition from the builder store, so it
 * re-renders live as state changes (the editor arrives in Phase 8).
 */
export function StorePreview({ onStartOver }: { onStartOver: () => void }) {
  const definition = useBuilderStore((s) => s.definition);
  const [device, setDevice] = useState<Device>('desktop');
  if (!definition) return null;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium">{definition.meta.name}</p>
          <p className="text-muted-foreground text-xs">
            Live preview · {definition.pages.length} pages · {definition.products.length} products
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div role="group" aria-label="Preview width" className="flex rounded-md border p-0.5">
            {(['desktop', 'mobile'] as const).map((d) => (
              <button
                key={d}
                type="button"
                aria-pressed={device === d}
                onClick={() => setDevice(d)}
                className={cn(
                  'rounded px-2.5 py-1 text-xs capitalize',
                  device === d ? 'bg-foreground text-background' : 'text-muted-foreground',
                )}
              >
                {d}
              </button>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={onStartOver}>
            Start over
          </Button>
          <Button size="sm" disabled>
            Save (Phase 9)
          </Button>
        </div>
      </div>

      <div className="bg-muted/30 overflow-hidden rounded-lg border">
        <div
          className={cn(
            'mx-auto overflow-y-auto',
            device === 'mobile' ? 'max-w-[390px]' : 'max-w-full',
          )}
          style={{ maxHeight: '70vh' }}
        >
          <StoreRenderer definition={definition} />
        </div>
      </div>
    </div>
  );
}
