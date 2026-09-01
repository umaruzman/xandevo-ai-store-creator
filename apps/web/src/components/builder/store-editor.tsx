'use client';

import { useState } from 'react';

import { EditorPanel } from '@/components/editor/editor-panel';
import { cn } from '@/lib/utils';

import { StorePreview } from './store-preview';

/**
 * Split view: inline editor on the left, live preview on the right. The editor
 * panel collapses so the preview can use the full width.
 */
export function StoreEditor({ onStartOver }: { onStartOver: () => void }) {
  const [editing, setEditing] = useState(true);

  return (
    <div
      className={cn(
        'grid gap-4',
        editing ? 'lg:grid-cols-[minmax(320px,380px)_1fr]' : 'lg:grid-cols-1',
      )}
    >
      {editing ? (
        <div className="flex flex-col rounded-xl border">
          <div className="flex items-center justify-between border-b px-4 py-2.5">
            <span className="text-sm font-medium">Edit store</span>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="text-muted-foreground hover:text-foreground text-xs transition-colors"
            >
              Hide
            </button>
          </div>
          <EditorPanel />
        </div>
      ) : null}
      <StorePreview
        onStartOver={onStartOver}
        editing={editing}
        onToggleEditing={() => setEditing((v) => !v)}
      />
    </div>
  );
}
