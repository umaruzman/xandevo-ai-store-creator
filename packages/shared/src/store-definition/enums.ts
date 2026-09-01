import { z } from 'zod';

/**
 * Every style/structure enum for the Store Definition v1.
 *
 * Structural enums (SectionType, LinkTargetType, StoreStatus, ProductImageKind,
 * ProductBadge) are persisted as Postgres enums. Presentational enums are persisted
 * as plain string columns and guarded here by Zod (the renderer falls back to a
 * default for any value it does not recognise). See docs/decisions/ADR-006.
 */

const tuple = <const T extends readonly [string, ...string[]]>(values: T): T => values;

// ── Structural ──────────────────────────────────────────────────────────────
export const STORE_STATUSES = tuple(['draft', 'saved']);
export const SECTION_TYPES = tuple([
  'hero',
  'categories',
  'productGrid',
  'richText',
  'contact',
  'cta',
]);
export const LINK_TARGET_TYPES = tuple(['page', 'section', 'external', 'none']);
export const PRODUCT_IMAGE_KINDS = tuple(['placeholder', 'url']);
export const PRODUCT_IMAGE_STYLES = tuple(['photo', 'illustration', 'pattern', 'mono']);
export const PRODUCT_BADGES = tuple(['new', 'limited', 'bestseller']);

// ── Theme ───────────────────────────────────────────────────────────────────
export const THEME_PRESETS = tuple([
  'minimal',
  'luxury',
  'playful',
  'brutalist',
  'warm-organic',
  'tech',
]);
export const HEADING_WEIGHTS = tuple(['regular', 'medium', 'semibold', 'bold']);
export const HEADING_CASES = tuple(['none', 'upper']);
export const LETTER_SPACINGS = tuple(['tight', 'normal', 'wide']);
export const BODY_LINE_HEIGHTS = tuple(['tight', 'normal', 'relaxed']);
export const FONT_PAIRINGS = tuple([
  'sans-sans',
  'serif-sans',
  'sans-serif',
  'serif-serif',
  'mono-sans',
]);
export const RADII = tuple(['none', 'sm', 'md', 'lg', 'full']);
export const BORDER_WIDTHS = tuple(['none', 'hairline', 'thin']);
export const BUTTON_SHAPES = tuple(['rounded', 'pill', 'square']);
export const SPACINGS = tuple(['compact', 'normal', 'roomy']);
export const SHADOWS = tuple(['none', 'soft', 'strong']);
export const MOTIONS = tuple(['none', 'subtle', 'expressive']);
export const CONTAINER_WIDTHS = tuple(['narrow', 'standard', 'wide']);
export const PAGE_BACKGROUNDS = tuple(['solid', 'subtle-gradient', 'pattern']);
export const SECTION_DIVIDERS = tuple(['none', 'line', 'shape']);

// ── Component variants (theme.components — JSON, Zod-guarded) ─────────────────
export const PRODUCT_CARD_VARIANTS = tuple(['standard', 'minimal', 'overlay', 'horizontal']);
export const PRODUCT_CARD_IMAGE_RATIOS = tuple(['square', 'portrait', 'landscape']);
export const PRODUCT_CARD_RADII = tuple(['inherit', 'none', 'sm', 'md', 'lg']);
export const PRODUCT_CARD_FRAMES = tuple(['none', 'border', 'shadow']);
export const PRODUCT_CARD_HOVERS = tuple(['none', 'lift', 'zoom', 'image-swap']);
export const PRODUCT_CARD_PRICE_PLACEMENTS = tuple(['under-title', 'beside-title', 'on-image']);
export const PRODUCT_CARD_CTAS = tuple(['button', 'link', 'icon']);
export const BUTTON_VARIANTS = tuple(['solid', 'outline', 'ghost']);
export const BUTTON_SIZES = tuple(['sm', 'md', 'lg']);
export const CATEGORY_CARD_VARIANTS = tuple(['image-tile', 'text-chip', 'icon-row']);

// ── Shared section layout ───────────────────────────────────────────────────
export const SECTION_BACKGROUNDS = tuple(['surface', 'muted', 'primary', 'accent', 'gradient']);
export const SECTION_CONTAINERS = tuple(['full', 'boxed', 'narrow']);
export const SECTION_PADDINGS = tuple(['sm', 'md', 'lg']);
export const SECTION_ALIGNS = tuple(['left', 'center']);

// ── Per-section layout ──────────────────────────────────────────────────────
export const HERO_LAYOUTS = tuple([
  'centered',
  'split-left',
  'split-right',
  'fullbleed-overlay',
  'minimal',
]);
export const HERO_HEIGHTS = tuple(['compact', 'standard', 'tall', 'viewport']);
export const RICH_TEXT_WIDTHS = tuple(['narrow', 'prose', 'wide']);
export const CTA_SECTION_LAYOUTS = tuple(['banner', 'boxed', 'split']);
export const CTA_EMPHASES = tuple(['subtle', 'bold']);
export const CONTACT_LAYOUTS = tuple(['form-left', 'form-right', 'stacked']);
export const CATEGORIES_LAYOUTS = tuple(['grid', 'scroller', 'list']);
export const PRODUCT_GRID_LAYOUTS = tuple(['grid', 'carousel']);

// ── Footer social ───────────────────────────────────────────────────────────
export const SOCIAL_PLATFORMS = tuple([
  'instagram',
  'facebook',
  'x',
  'tiktok',
  'youtube',
  'linkedin',
  'pinterest',
]);
export const ANNOUNCEMENT_TONES = tuple(['primary', 'accent', 'dark']);
export const HEADER_VARIANTS = tuple(['minimal', 'centered-logo', 'with-search']);

/** Grid column counts allowed for grid/scroller sections. */
export const GRID_COLUMNS = [2, 3, 4] as const;

export const zEnum = <const T extends readonly [string, ...string[]]>(values: T) => z.enum(values);
