export function GenerationStatus() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="text-muted-foreground flex items-center gap-2 text-sm"
    >
      <span className="bg-primary size-2.5 animate-pulse rounded-full" aria-hidden />
      Generating your storefront — this can take up to a minute.
    </div>
  );
}
