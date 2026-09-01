// @vitest-environment node
import { describe, expect, it } from 'vitest';

import {
  HERO_LAYOUT,
  PRODUCT_CARD_FRAME,
  SECTION_BACKGROUND,
  SECTION_CONTAINER,
  SECTION_PADDING,
  pick,
} from './recipes';

describe('pick', () => {
  it('returns the mapped class for a known key', () => {
    expect(pick(SECTION_PADDING, 'lg', 'md')).toBe(SECTION_PADDING.lg);
  });

  it('falls back to the default for an unknown key', () => {
    expect(pick(SECTION_PADDING, 'enormous', 'md')).toBe(SECTION_PADDING.md);
    expect(pick(HERO_LAYOUT, 'spiral', 'centered')).toBe(HERO_LAYOUT.centered);
  });

  it('every documented value in a map resolves to a non-empty, distinct class', () => {
    for (const map of [SECTION_BACKGROUND, SECTION_CONTAINER, HERO_LAYOUT]) {
      const classes = Object.values(map);
      for (const c of classes) expect(c.length).toBeGreaterThan(0);
      expect(new Set(classes).size).toBe(classes.length);
    }
  });

  it('a variant with an intentionally empty class still resolves (not the fallback)', () => {
    expect(pick(PRODUCT_CARD_FRAME, 'none', 'border')).toBe('');
  });
});
