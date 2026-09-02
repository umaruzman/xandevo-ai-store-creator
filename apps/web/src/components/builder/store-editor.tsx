'use client';

import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useState } from 'react';

import { EditorPanel } from '@/components/editor/editor-panel';
import { cn } from '@/lib/utils';

import { StorePreview } from './store-preview';

/**
 * Full-bleed customizer: a controls sidebar on the left, a live storefront
 * preview filling the rest. The sidebar collapses to a slim rail (never to
 * zero) so it can always be reopened.
 */
export function StoreEditor({ onStartOver }: { onStartOver: () => void }) {
  const [open, setOpen] = useState(true);

  return (
    <div className="flex h-[calc(100dvh-3.5rem)] w-full overflow-hidden border-t">
      <aside
        className={cn(
          'bg-background flex shrink-0 flex-col border-r transition-[width] duration-200 ease-out',
          open ? 'w-[340px]' : 'w-12',
        )}
      >
        <div
          className={cn(
            'flex h-12 shrink-0 items-center border-b',
            open ? 'justify-between px-4' : 'justify-center px-0',
          )}
        >
          {open ? <span className="text-sm font-semibold">Customize</span> : null}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? 'Collapse panel' : 'Expand panel'}
            aria-expanded={open}
            className="text-muted-foreground hover:text-foreground hover:bg-muted grid size-8 place-items-center rounded-md transition-colors"
          >
            {open ? <PanelLeftClose className="size-4" /> : <PanelLeftOpen className="size-4" />}
          </button>
        </div>
        {open ? (
          <div className="min-h-0 flex-1 overflow-hidden">
            <EditorPanel />
          </div>
        ) : null}
      </aside>

      <StorePreview onStartOver={onStartOver} />
    </div>
  );
}
