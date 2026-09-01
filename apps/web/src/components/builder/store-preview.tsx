'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { StoreRenderer } from '@/components/renderer/store-renderer';
import { Button } from '@/components/ui/button';
import { ClientApiError, useCreateStore, useUpdateStore } from '@/lib/queries/stores';
import { selectIsDirty, useBuilderStore } from '@/lib/store/builder';
import { cn } from '@/lib/utils';

type Device = 'desktop' | 'mobile';

/**
 * Preview chrome (device toggle, dirty state, Save/Start over) wrapping the
 * schema-driven `<StoreRenderer>`. Reads the working definition from the builder
 * store, so it re-renders live as the editor mutates state.
 */
export function StorePreview({
  onStartOver,
  editing = true,
  onToggleEditing,
}: {
  onStartOver: () => void;
  editing?: boolean;
  onToggleEditing?: () => void;
}) {
  const definition = useBuilderStore((s) => s.definition);
  const storeId = useBuilderStore((s) => s.storeId);
  const promptText = useBuilderStore((s) => s.promptText);
  const promptVersion = useBuilderStore((s) => s.promptVersion);
  const markSaved = useBuilderStore((s) => s.markSaved);
  const isDirty = useBuilderStore(selectIsDirty);

  const [device, setDevice] = useState<Device>('desktop');
  const [pageSlug, setPageSlug] = useState('home');
  const [saveError, setSaveError] = useState<string | null>(null);
  const router = useRouter();
  const create = useCreateStore();
  const update = useUpdateStore(storeId ?? '');
  const saving = create.isPending || update.isPending;

  if (!definition) return null;

  async function onSave() {
    if (!definition) return;
    setSaveError(null);
    try {
      if (storeId) {
        const store = await update.mutateAsync({ definition });
        markSaved({
          id: store.id,
          definition: store.definition,
          promptVersion: store.promptVersion,
        });
      } else {
        const store = await create.mutateAsync({
          name: definition.meta.name,
          prompt: promptText ?? 'Generated store',
          promptVersion: promptVersion ?? 'store@v1',
          definition,
        });
        markSaved({
          id: store.id,
          definition: store.definition,
          promptVersion: store.promptVersion,
        });
        router.push(`/stores/${store.id}`);
      }
    } catch (err) {
      setSaveError(
        err instanceof ClientApiError ? err.message : 'Could not save. Please try again.',
      );
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-sm font-medium">
            {definition.meta.name}
            {isDirty ? (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-800">
                Unsaved changes
              </span>
            ) : null}
          </p>
          <p className="text-muted-foreground text-xs">
            {storeId ? 'Saved store' : 'Draft'} · {definition.pages.length} pages ·{' '}
            {definition.products.length} products
          </p>
        </div>
        <div className="flex items-center gap-2">
          {onToggleEditing && !editing ? (
            <Button variant="outline" size="sm" onClick={onToggleEditing}>
              Edit store
            </Button>
          ) : null}
          <div role="group" aria-label="Preview width" className="flex rounded-md border p-0.5">
            {(['desktop', 'mobile'] as const).map((d) => (
              <button
                key={d}
                type="button"
                aria-pressed={device === d}
                onClick={() => setDevice(d)}
                className={cn(
                  'rounded px-2.5 py-1 text-xs capitalize transition-colors',
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
          <Button size="sm" onClick={onSave} disabled={saving || (!isDirty && !!storeId)}>
            {saving ? 'Saving…' : storeId ? 'Save changes' : 'Save store'}
          </Button>
        </div>
      </div>

      {definition.pages.length > 1 ? (
        <div role="group" aria-label="Preview page" className="flex flex-wrap gap-1">
          {[...definition.pages]
            .sort((a, b) => a.order - b.order)
            .map((p) => (
              <button
                key={p.id}
                type="button"
                aria-pressed={pageSlug === p.slug}
                onClick={() => setPageSlug(p.slug)}
                className={cn(
                  'rounded-full border px-3 py-1 text-xs transition-colors',
                  pageSlug === p.slug
                    ? 'bg-foreground text-background border-foreground'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {p.title}
              </button>
            ))}
        </div>
      ) : null}

      {saveError ? (
        <p role="alert" className="text-destructive text-xs">
          {saveError}
        </p>
      ) : null}

      <div className="bg-muted/30 overflow-hidden rounded-xl border">
        <div
          className={cn(
            'mx-auto overflow-y-auto',
            device === 'mobile' ? 'max-w-[390px]' : 'max-w-full',
          )}
          style={{ maxHeight: '82vh' }}
        >
          <StoreRenderer definition={definition} pageSlug={pageSlug} />
        </div>
      </div>
    </div>
  );
}
