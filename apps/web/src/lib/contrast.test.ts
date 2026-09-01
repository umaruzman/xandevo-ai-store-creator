// @vitest-environment node
import { describe, expect, it } from 'vitest';

import { AA_NORMAL, contrastRatio } from './contrast';

describe('contrastRatio', () => {
  it('black on white is the maximum ~21:1', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 0);
  });

  it('a colour against itself is 1:1', () => {
    expect(contrastRatio('#3366cc', '#3366cc')).toBe(1);
  });

  it('is order-independent and handles shorthand hex', () => {
    expect(contrastRatio('#fff', '#000')).toBe(contrastRatio('#000', '#fff'));
  });

  it('flags a low-contrast pair below AA', () => {
    expect(contrastRatio('#777777', '#888888')).toBeLessThan(AA_NORMAL);
  });
});
