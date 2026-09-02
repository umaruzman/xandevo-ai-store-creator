export default function StoreLoading() {
  return (
    <div className="flex h-[calc(100dvh-3.5rem)] w-full border-t" role="status" aria-live="polite">
      <span className="sr-only">Loading store…</span>
      <div className="bg-muted/40 w-[340px] shrink-0 animate-pulse border-r" />
      <div className="bg-muted/20 flex-1 animate-pulse" />
    </div>
  );
}
