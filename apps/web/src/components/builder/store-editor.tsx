'use client';

import { EditorPanel } from '@/components/editor/editor-panel';

import { StorePreview } from './store-preview';

/** Split view: inline editor on the left, live preview on the right. */
export function StoreEditor({ onStartOver }: { onStartOver: () => void }) {
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(300px,360px)_1fr]">
      <div className="rounded-lg border">
        <div className="border-b px-4 py-2 text-sm font-medium">Edit</div>
        <EditorPanel />
      </div>
      <StorePreview onStartOver={onStartOver} />
    </div>
  );
}
