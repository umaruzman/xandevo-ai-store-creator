// @vitest-environment node
import { describe, expect, it } from 'vitest';

import { hashValue, stableStringify } from './hash';

describe('stableStringify', () => {
  it('is independent of key insertion order', () => {
    expect(stableStringify({ b: 1, a: [{ y: 2, x: 1 }] })).toBe(
      stableStringify({ a: [{ x: 1, y: 2 }], b: 1 }),
    );
  });
});

describe('hashValue', () => {
  it('is stable and distinguishes different values', () => {
    const a = { name: 'Maison Oud', products: [1, 2, 3] };
    expect(hashValue(a)).toBe(hashValue({ products: [1, 2, 3], name: 'Maison Oud' }));
    expect(hashValue(a)).not.toBe(hashValue({ ...a, name: 'Other' }));
  });
});
