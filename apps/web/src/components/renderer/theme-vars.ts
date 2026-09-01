import type { Theme } from '@xandevo/shared';
import type { CSSProperties } from 'react';

const SERIF = "Georgia, 'Times New Roman', serif";
const SANS = "system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
const MONO = "ui-monospace, 'SF Mono', Menlo, Consolas, monospace";

const FONT_PAIRINGS: Record<string, { heading: string; body: string }> = {
  'sans-sans': { heading: SANS, body: SANS },
  'serif-sans': { heading: SERIF, body: SANS },
  'sans-serif': { heading: SANS, body: SERIF },
  'serif-serif': { heading: SERIF, body: SERIF },
  'mono-sans': { heading: MONO, body: SANS },
};

const RADIUS: Record<string, string> = {
  none: '0px',
  sm: '4px',
  md: '10px',
  lg: '18px',
  full: '9999px',
};
const BORDER_WIDTH: Record<string, string> = { none: '0px', hairline: '1px', thin: '2px' };
const SHADOW: Record<string, string> = {
  none: 'none',
  soft: '0 1px 3px rgb(0 0 0 / 0.08), 0 8px 24px rgb(0 0 0 / 0.06)',
  strong: '0 2px 6px rgb(0 0 0 / 0.14), 0 16px 40px rgb(0 0 0 / 0.12)',
};
const SPACING: Record<string, string> = { compact: '0.85', normal: '1', roomy: '1.25' };
const CONTAINER: Record<string, string> = {
  narrow: '48rem',
  standard: '72rem',
  wide: '88rem',
};
const HEADING_WEIGHT: Record<string, string> = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
};
const LETTER_SPACING: Record<string, string> = {
  tight: '-0.02em',
  normal: '0',
  wide: '0.08em',
};
const LINE_HEIGHT: Record<string, string> = { tight: '1.35', normal: '1.6', relaxed: '1.8' };

const g = <T extends string>(map: Record<T, string>, key: string, fallback: T): string =>
  (map as Record<string, string>)[key] ?? map[fallback];

/** Hex → a readable foreground for text placed on that colour. */
function contrastOn(hex: string): string {
  const h = hex.replace('#', '');
  const full =
    h.length === 3
      ? h
          .split('')
          .map((c) => c + c)
          .join('')
      : h;
  const r = parseInt(full.slice(0, 2), 16);
  const gc = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * gc + 0.114 * b) / 255;
  return luminance > 0.55 ? '#111111' : '#ffffff';
}

/**
 * Resolve a fully-normalized `theme` to `--sf-*` CSS custom properties set on the
 * storefront root. Section components consume these; nothing else styles the
 * storefront. Values are validated tokens, never arbitrary CSS.
 */
export function resolveThemeVars(theme: Theme): CSSProperties {
  const { colors, typography, style } = theme;
  const fonts = FONT_PAIRINGS[typography.fontPairing] ?? FONT_PAIRINGS['sans-sans']!;

  return {
    '--sf-primary': colors.primary,
    '--sf-secondary': colors.secondary,
    '--sf-background': colors.background,
    '--sf-surface': colors.surface,
    '--sf-text': colors.text,
    '--sf-muted': colors.muted,
    '--sf-accent': colors.accent,
    '--sf-border': colors.border,
    '--sf-muted-bg': colors.muted + '1f',
    '--sf-primary-contrast': contrastOn(colors.primary),
    '--sf-font-heading': fonts.heading,
    '--sf-font-body': fonts.body,
    '--sf-font-size-base': `${typography.baseSizePx}px`,
    '--sf-scale': String(typography.scaleRatio),
    '--sf-heading-weight': g(HEADING_WEIGHT, typography.headingWeight, 'semibold'),
    '--sf-letter-spacing': g(LETTER_SPACING, typography.letterSpacing, 'normal'),
    '--sf-line-height': g(LINE_HEIGHT, typography.bodyLineHeight, 'normal'),
    '--sf-radius': g(RADIUS, style.radius, 'md'),
    '--sf-border-width': g(BORDER_WIDTH, style.borderWidth, 'hairline'),
    '--sf-shadow': g(SHADOW, style.shadow, 'soft'),
    '--sf-space': g(SPACING, style.spacing, 'normal'),
    '--sf-container': g(CONTAINER, style.containerWidth, 'standard'),
    '--sf-button-radius':
      style.buttonShape === 'pill'
        ? '9999px'
        : style.buttonShape === 'square'
          ? '0px'
          : g(RADIUS, style.radius, 'md'),
  } as CSSProperties;
}
