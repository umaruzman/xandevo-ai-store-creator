// @vitest-environment node
import { describe, expect, it } from 'vitest';

import { placeholderImage } from './placeholder-image';

describe('placeholderImage', () => {
  it('returns a self-contained SVG data URI with no scripts', () => {
    const uri = placeholderImage('royal-oud-50', 'Royal Oud 50ml');
    expect(uri.startsWith('data:image/svg+xml;utf8,')).toBe(true);
    const decoded = decodeURIComponent(uri.slice('data:image/svg+xml;utf8,'.length));
    expect(decoded).toContain('<svg');
    expect(decoded).not.toContain('<script');
    expect(decoded).toContain('>RO<'); // initials
  });

  it('is deterministic for a given seed', () => {
    expect(placeholderImage('amber-noir', 'Amber Noir')).toBe(
      placeholderImage('amber-noir', 'Amber Noir'),
    );
    expect(placeholderImage('a', 'X')).not.toBe(placeholderImage('b', 'X'));
  });
});
