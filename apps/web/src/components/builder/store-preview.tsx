'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useMemo, useRef, useState, type MouseEvent } from 'react';

import { StoreRenderer } from '@/components/renderer/store-renderer';
import { Button } from '@/components/ui/button';
import { ClientApiError, useCreateStore, useUpdateStore } from '@/lib/queries/stores';
import { selectIsDirty, useBuilderStore } from '@/lib/store/builder';
import { cn } from '@/lib/utils';

type Device = 'desktop' | 'mobile';

/**
 * The preview pane of the customizer: a toolbar (device toggle, dirty state,
 * Save / Start over) over a full-height storefront render. Navigation between
 * pages happens by clicking the storefront's own nav links — no separate tabs.
 */
export function StorePreview({
  onStartOver,
  sidebarOpen = true,
  onOpenSidebar,
}: {
  onStartOver: () => void;
  sidebarOpen?: boolean;
  onOpenSidebar?: () => void;
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
  const canvasRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const create = useCreateStore();
  const update = useUpdateStore(storeId ?? '');
  const saving = create.isPending || update.isPending;

  const slugs = useMemo(
    () => new Set((definition?.pages ?? []).map((p) => p.slug)),
    [definition?.pages],
  );

  /** Intercept clicks on the rendered storefront's own hash links: a page slug
   *  switches the previewed page; anything else scrolls within the canvas. */
  const onCanvasClick = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      const anchor = (e.target as HTMLElement).closest('a');
      const href = anchor?.getAttribute('href');
      if (!href || !href.startsWith('#')) return;
      e.preventDefault();
      const id = href.slice(1);
      if (slugs.has(id)) {
        setPageSlug(id);
        canvasRef.current?.scrollTo({ top: 0 });
      } else if (id) {
        canvasRef.current
          ?.querySelector(`#${CSS.escape(id)}`)
          ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    },
    [slugs],
  );

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

  const currentPage = definition.pages.find((p) => p.slug === pageSlug);

  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <div className="flex flex-wrap items-center gap-3 border-b px-4 py-2.5">
        {!sidebarOpen && onOpenSidebar ? (
          <Button variant="outline" size="sm" onClick={onOpenSidebar}>
            Customize
          </Button>
        ) : null}

        <div className="mr-auto min-w-0">
          <p className="flex items-center gap-2 truncate text-sm font-medium">
            {definition.meta.name}
            <span className="text-muted-foreground font-normal">
              / {currentPage?.title ?? 'Home'}
            </span>
            {isDirty ? (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-800">
                Unsaved changes
              </span>
            ) : null}
          </p>
        </div>

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

      {saveError ? (
        <p role="alert" className="text-destructive border-b px-4 py-2 text-xs">
          {saveError}
        </p>
      ) : null}

      <div ref={canvasRef} className="bg-muted/40 min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
        <div
          onClickCapture={onCanvasClick}
          className={cn(
            'bg-background mx-auto overflow-hidden rounded-xl border shadow-sm transition-[max-width] duration-200',
            device === 'mobile' ? 'max-w-[390px]' : 'max-w-[1200px]',
          )}
        >
          <StoreRenderer definition={definition} pageSlug={pageSlug} />
        </div>
      </div>
    </div>
  );
}
