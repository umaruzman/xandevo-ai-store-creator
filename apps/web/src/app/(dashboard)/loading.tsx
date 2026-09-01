export default function DashboardLoading() {
  return (
    <div className="space-y-4" role="status" aria-live="polite">
      <span className="sr-only">Loading…</span>
      <div className="bg-muted h-7 w-40 animate-pulse rounded" />
      <div className="bg-muted h-24 animate-pulse rounded-lg" />
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="bg-muted h-20 animate-pulse rounded-lg" />
        <div className="bg-muted h-20 animate-pulse rounded-lg" />
      </div>
    </div>
  );
}
