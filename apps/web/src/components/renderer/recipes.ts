/**
 * Every storefront style enum maps to a fixed set of Tailwind classes. The model
 * only ever selects a key; `pick` falls back to a documented default for any
 * value the renderer does not recognise (unknown-enum fail-safe, Phase 7 gate).
 */
export function pick<T extends string>(map: Record<T, string>, key: string, fallback: T): string {
  return (map as Record<string, string>)[key] ?? map[fallback];
}

// ── Shared section layout ──────────────────────────────────────────────────
export const SECTION_BACKGROUND: Record<string, string> = {
  surface: 'bg-[var(--sf-surface)] text-[var(--sf-text)]',
  muted: 'bg-[var(--sf-muted-bg)] text-[var(--sf-text)]',
  primary: 'bg-[var(--sf-primary)] text-[var(--sf-primary-contrast)]',
  accent: 'bg-[var(--sf-accent)] text-[var(--sf-primary-contrast)]',
  gradient:
    'bg-gradient-to-b from-[var(--sf-surface)] to-[var(--sf-muted-bg)] text-[var(--sf-text)]',
};
export const SECTION_CONTAINER: Record<string, string> = {
  full: 'w-full px-4 sm:px-6',
  boxed: 'mx-auto w-full max-w-[var(--sf-container)] px-4 sm:px-6',
  narrow: 'mx-auto w-full max-w-2xl px-4 sm:px-6',
};
export const SECTION_PADDING: Record<string, string> = {
  sm: 'py-8',
  md: 'py-12 sm:py-16',
  lg: 'py-16 sm:py-24',
};
export const SECTION_ALIGN: Record<string, string> = {
  left: 'text-left items-start',
  center: 'text-center items-center',
};

// ── Hero ──────────────────────────────────────────────────────────────────
export const HERO_LAYOUT: Record<string, string> = {
  centered: 'flex flex-col gap-4 text-center items-center',
  'split-left': 'flex flex-col gap-4 md:items-start md:text-left',
  'split-right': 'flex flex-col gap-4 md:items-end md:text-right',
  'fullbleed-overlay': 'flex flex-col gap-4 items-center text-center',
  minimal: 'flex flex-col gap-2',
};
export const HERO_HEIGHT: Record<string, string> = {
  compact: 'min-h-[220px] justify-center',
  standard: 'min-h-[340px] justify-center',
  tall: 'min-h-[460px] justify-center',
  viewport: 'min-h-[70vh] justify-center',
};

// ── Rich text ─────────────────────────────────────────────────────────────
export const RICH_TEXT_WIDTH: Record<string, string> = {
  narrow: 'max-w-md',
  prose: 'max-w-2xl',
  wide: 'max-w-4xl',
};

// ── CTA section ───────────────────────────────────────────────────────────
export const CTA_SECTION_LAYOUT: Record<string, string> = {
  banner: 'flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between',
  boxed: 'flex flex-col items-center gap-3 rounded-[var(--sf-radius)] border p-8 text-center',
  split: 'grid gap-4 sm:grid-cols-2 sm:items-center',
};
export const CTA_EMPHASIS: Record<string, string> = {
  subtle: '',
  bold: 'text-2xl font-[var(--sf-heading-weight)] sm:text-3xl',
};

// ── Contact ───────────────────────────────────────────────────────────────
export const CONTACT_LAYOUT: Record<string, string> = {
  'form-left': 'grid gap-8 md:grid-cols-2',
  'form-right': 'grid gap-8 md:grid-cols-2 md:[&>*:first-child]:order-2',
  stacked: 'flex flex-col gap-6',
};

// ── Categories ────────────────────────────────────────────────────────────
export const CATEGORIES_LAYOUT: Record<string, string> = {
  grid: 'grid gap-4',
  scroller: 'flex gap-4 overflow-x-auto pb-2',
  list: 'flex flex-col divide-y',
};
export const CATEGORY_CARD_VARIANT: Record<string, string> = {
  'image-tile':
    'flex aspect-video items-end rounded-[var(--sf-radius)] border bg-[var(--sf-muted-bg)] p-3 font-medium',
  'text-chip': 'rounded-full border px-3 py-1 text-sm',
  'icon-row': 'flex items-center gap-2 py-3 text-sm',
};

// ── Product grid + card ───────────────────────────────────────────────────
export const PRODUCT_GRID_LAYOUT: Record<string, string> = {
  grid: 'grid gap-4',
  carousel: 'flex gap-4 overflow-x-auto pb-2 [&>*]:w-56 [&>*]:shrink-0',
};
export const GRID_COLUMNS: Record<string, string> = {
  '2': 'grid-cols-2',
  '3': 'grid-cols-2 sm:grid-cols-3',
  '4': 'grid-cols-2 sm:grid-cols-4',
};
export const PRODUCT_CARD_VARIANT: Record<string, string> = {
  standard: 'flex flex-col gap-2',
  minimal: 'flex flex-col gap-1',
  overlay: 'relative flex flex-col justify-end overflow-hidden',
  horizontal: 'flex gap-3',
};
export const PRODUCT_CARD_FRAME: Record<string, string> = {
  none: '',
  border: 'border rounded-[var(--sf-radius)] p-2',
  shadow: 'rounded-[var(--sf-radius)] p-2 shadow-[var(--sf-shadow)]',
};
export const PRODUCT_CARD_IMAGE_RATIO: Record<string, string> = {
  square: 'aspect-square',
  portrait: 'aspect-[3/4]',
  landscape: 'aspect-[4/3]',
};
export const PRODUCT_CARD_HOVER: Record<string, string> = {
  none: '',
  lift: 'transition-transform duration-200 hover:-translate-y-1',
  zoom: 'transition-transform duration-200 hover:scale-[1.02]',
  'image-swap': 'transition-opacity duration-200 hover:opacity-90',
};

// ── Button ────────────────────────────────────────────────────────────────
export const BUTTON_VARIANT: Record<string, string> = {
  solid: 'bg-[var(--sf-primary)] text-[var(--sf-primary-contrast)]',
  outline: 'border border-[var(--sf-primary)] text-[var(--sf-primary)]',
  ghost: 'text-[var(--sf-primary)] hover:bg-[var(--sf-muted-bg)]',
};
export const BUTTON_SIZE: Record<string, string> = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-10 px-5 text-sm',
  lg: 'h-12 px-7 text-base',
};

// ── Typography ────────────────────────────────────────────────────────────
export const HEADING_CASE: Record<string, string> = {
  none: '',
  upper: 'uppercase',
};

// ── Header / announcement ─────────────────────────────────────────────────
export const HEADER_VARIANT: Record<string, string> = {
  minimal: 'flex items-center justify-between',
  'centered-logo': 'flex flex-col items-center gap-2 text-center',
  'with-search': 'flex items-center justify-between gap-4',
};
export const ANNOUNCEMENT_TONE: Record<string, string> = {
  primary: 'bg-[var(--sf-primary)] text-[var(--sf-primary-contrast)]',
  accent: 'bg-[var(--sf-accent)] text-[var(--sf-primary-contrast)]',
  dark: 'bg-[var(--sf-text)] text-[var(--sf-surface)]',
};
