import { z } from 'zod';

import {
  BODY_LINE_HEIGHTS,
  BORDER_WIDTHS,
  BUTTON_SHAPES,
  BUTTON_SIZES,
  BUTTON_VARIANTS,
  CATEGORY_CARD_VARIANTS,
  CONTAINER_WIDTHS,
  FONT_PAIRINGS,
  HEADING_CASES,
  HEADING_WEIGHTS,
  LETTER_SPACINGS,
  MOTIONS,
  PAGE_BACKGROUNDS,
  PRODUCT_CARD_CTAS,
  PRODUCT_CARD_FRAMES,
  PRODUCT_CARD_HOVERS,
  PRODUCT_CARD_IMAGE_RATIOS,
  PRODUCT_CARD_PRICE_PLACEMENTS,
  PRODUCT_CARD_RADII,
  PRODUCT_CARD_VARIANTS,
  RADII,
  SECTION_DIVIDERS,
  SHADOWS,
  SPACINGS,
  THEME_PRESETS,
  zEnum,
} from './enums.js';
import { hexColor } from './primitives.js';

export const themeColorsSchema = z.object({
  primary: hexColor,
  secondary: hexColor,
  background: hexColor,
  surface: hexColor,
  text: hexColor,
  muted: hexColor,
  accent: hexColor,
  border: hexColor,
});

export const themeTypographySchema = z.object({
  fontPairing: zEnum(FONT_PAIRINGS),
  baseSizePx: z.number().int().min(14).max(18),
  scaleRatio: z.number().min(1.125).max(1.333),
  headingWeight: zEnum(HEADING_WEIGHTS),
  headingCase: zEnum(HEADING_CASES),
  letterSpacing: zEnum(LETTER_SPACINGS),
  bodyLineHeight: zEnum(BODY_LINE_HEIGHTS),
});

export const themeStyleSchema = z.object({
  radius: zEnum(RADII),
  borderWidth: zEnum(BORDER_WIDTHS),
  buttonShape: zEnum(BUTTON_SHAPES),
  spacing: zEnum(SPACINGS),
  shadow: zEnum(SHADOWS),
  motion: zEnum(MOTIONS),
  containerWidth: zEnum(CONTAINER_WIDTHS),
  pageBackground: zEnum(PAGE_BACKGROUNDS),
  sectionDividers: zEnum(SECTION_DIVIDERS),
});

export const productCardStyleSchema = z.object({
  variant: zEnum(PRODUCT_CARD_VARIANTS),
  imageRatio: zEnum(PRODUCT_CARD_IMAGE_RATIOS),
  radius: zEnum(PRODUCT_CARD_RADII),
  frame: zEnum(PRODUCT_CARD_FRAMES),
  hover: zEnum(PRODUCT_CARD_HOVERS),
  pricePlacement: zEnum(PRODUCT_CARD_PRICE_PLACEMENTS),
  showBadges: z.boolean(),
  cta: zEnum(PRODUCT_CARD_CTAS),
});

export const buttonStyleSchema = z.object({
  variant: zEnum(BUTTON_VARIANTS),
  size: zEnum(BUTTON_SIZES),
});

export const categoryCardStyleSchema = z.object({
  variant: zEnum(CATEGORY_CARD_VARIANTS),
});

export const themeComponentsSchema = z.object({
  productCard: productCardStyleSchema,
  button: buttonStyleSchema,
  categoryCard: categoryCardStyleSchema,
});

export const themeSchema = z.object({
  preset: zEnum(THEME_PRESETS),
  colors: themeColorsSchema,
  typography: themeTypographySchema,
  style: themeStyleSchema,
  components: themeComponentsSchema,
});

export type Theme = z.infer<typeof themeSchema>;
export type ThemeColors = z.infer<typeof themeColorsSchema>;
export type ThemeComponents = z.infer<typeof themeComponentsSchema>;

// ── Preset defaults ─────────────────────────────────────────────────────────
// The AI (and editor) may supply a partial theme; the normalizer fills gaps from
// the chosen preset. Colours always come from the model/editor (no preset default).

type PresetDefaults = {
  typography: z.infer<typeof themeTypographySchema>;
  style: z.infer<typeof themeStyleSchema>;
  components: ThemeComponents;
};

const BASE: PresetDefaults = {
  typography: {
    fontPairing: 'sans-sans',
    baseSizePx: 16,
    scaleRatio: 1.25,
    headingWeight: 'semibold',
    headingCase: 'none',
    letterSpacing: 'normal',
    bodyLineHeight: 'normal',
  },
  style: {
    radius: 'md',
    borderWidth: 'hairline',
    buttonShape: 'rounded',
    spacing: 'normal',
    shadow: 'soft',
    motion: 'subtle',
    containerWidth: 'standard',
    pageBackground: 'solid',
    sectionDividers: 'none',
  },
  components: {
    productCard: {
      variant: 'standard',
      imageRatio: 'square',
      radius: 'inherit',
      frame: 'shadow',
      hover: 'lift',
      pricePlacement: 'under-title',
      showBadges: true,
      cta: 'button',
    },
    button: { variant: 'solid', size: 'md' },
    categoryCard: { variant: 'image-tile' },
  },
};

const merge = (over: DeepPartial<PresetDefaults>): PresetDefaults => ({
  typography: { ...BASE.typography, ...over.typography },
  style: { ...BASE.style, ...over.style },
  components: {
    productCard: { ...BASE.components.productCard, ...over.components?.productCard },
    button: { ...BASE.components.button, ...over.components?.button },
    categoryCard: { ...BASE.components.categoryCard, ...over.components?.categoryCard },
  },
});

type DeepPartial<T> = { [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K] };

export const PRESET_DEFAULTS: Record<(typeof THEME_PRESETS)[number], PresetDefaults> = {
  minimal: merge({
    typography: { fontPairing: 'sans-sans', headingWeight: 'medium' },
    style: { radius: 'sm', shadow: 'none', sectionDividers: 'line' },
    components: { productCard: { variant: 'minimal', frame: 'none', hover: 'none' } },
  }),
  luxury: merge({
    typography: {
      fontPairing: 'serif-sans',
      headingWeight: 'regular',
      headingCase: 'upper',
      letterSpacing: 'wide',
    },
    style: { radius: 'sm', spacing: 'roomy', shadow: 'soft' },
    components: {
      productCard: { variant: 'overlay', pricePlacement: 'on-image' },
      button: { variant: 'outline' },
    },
  }),
  playful: merge({
    typography: { headingWeight: 'bold' },
    style: { radius: 'lg', buttonShape: 'pill', motion: 'expressive' },
    components: { productCard: { hover: 'lift', frame: 'shadow' } },
  }),
  brutalist: merge({
    typography: { headingWeight: 'bold', letterSpacing: 'tight' },
    style: { radius: 'none', borderWidth: 'thin', shadow: 'none', motion: 'none' },
    components: { productCard: { frame: 'border', hover: 'none' }, button: { variant: 'outline' } },
  }),
  'warm-organic': merge({
    style: { radius: 'md', spacing: 'roomy', pageBackground: 'subtle-gradient' },
    components: { productCard: { imageRatio: 'portrait' } },
  }),
  tech: merge({
    style: { radius: 'md', shadow: 'soft', motion: 'subtle' },
    components: { productCard: { variant: 'standard' } },
  }),
};
