export default function StoreLoading() {
  return (
    <div className="space-y-4" role="status" aria-live="polite">
      <span className="sr-only">Loading store…</span>
      <div className="bg-muted h-8 w-48 animate-pulse rounded" />
      <div className="grid gap-4 lg:grid-cols-[minmax(300px,360px)_1fr]">
        <div className="bg-muted h-[70vh] animate-pulse rounded-lg" />
        <div className="bg-muted h-[70vh] animate-pulse rounded-lg" />
      </div>
    </div>
  );
}
