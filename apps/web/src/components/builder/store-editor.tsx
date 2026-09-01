'use client';

import { useState } from 'react';

import { EditorPanel } from '@/components/editor/editor-panel';
import { cn } from '@/lib/utils';

import { StorePreview } from './store-preview';

/**
 * Full-bleed customizer: a collapsible controls sidebar on the left, a live
 * storefront preview filling the rest — closer to a site builder than a form.
 * Breaks out of the dashboard's centered column to use the whole viewport.
 */
export function StoreEditor({ onStartOver }: { onStartOver: () => void }) {
  const [open, setOpen] = useState(true);

  return (
    <div className="-my-6 mx-[calc(50%-50vw)] flex h-[calc(100dvh-3.5rem)] w-screen overflow-hidden border-t">
      <aside
        data-open={open}
        className={cn(
          'bg-background flex shrink-0 flex-col border-r transition-[width] duration-200 ease-out',
          open ? 'w-[340px]' : 'w-0',
        )}
      >
        <div className="flex items-center justify-between border-b px-4 py-3">
          <span className="text-sm font-semibold">Customize</span>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="text-muted-foreground hover:text-foreground text-xs"
          >
            Collapse
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-hidden">
          <EditorPanel />
        </div>
      </aside>

      <StorePreview
        onStartOver={onStartOver}
        sidebarOpen={open}
        onOpenSidebar={() => setOpen(true)}
      />
    </div>
  );
}
