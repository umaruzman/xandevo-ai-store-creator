// @vitest-environment node
import { describe, expect, it } from 'vitest';

import { getAtPath, setAtPath } from './set-path';

describe('setAtPath', () => {
  it('sets a nested value without mutating the input', () => {
    const root = { meta: { name: 'A' }, list: [{ x: 1 }, { x: 2 }] };
    const next = setAtPath(root, ['meta', 'name'], 'B');
    expect(next).not.toBe(root);
    expect(next.meta.name).toBe('B');
    expect(root.meta.name).toBe('A'); // untouched
  });

  it('clones only the nodes on the path; siblings keep identity', () => {
    const root = {
      theme: { colors: { primary: '#111', accent: '#222' } },
      products: [{ id: 'p1' }, { id: 'p2' }],
    };
    const next = setAtPath(root, ['theme', 'colors', 'primary'], '#000');

    expect(next.theme).not.toBe(root.theme);
    expect(next.theme.colors).not.toBe(root.theme.colors);
    expect(next.products).toBe(root.products); // sibling subtree untouched
    expect(next.theme.colors.accent).toBe(root.theme.colors.accent);
  });

  it('replaces an array element by index and keeps other elements', () => {
    const root = { items: [{ n: 1 }, { n: 2 }, { n: 3 }] };
    const next = setAtPath(root, ['items', 1, 'n'], 99);
    expect(next.items[1]!.n).toBe(99);
    expect(next.items[0]).toBe(root.items[0]);
    expect(next.items[2]).toBe(root.items[2]);
    expect(next.items).not.toBe(root.items);
  });

  it('getAtPath reads back what setAtPath wrote', () => {
    const root = setAtPath({ a: { b: [{}, { c: 0 }] } }, ['a', 'b', 1, 'c'], 7);
    expect(getAtPath(root, ['a', 'b', 1, 'c'])).toBe(7);
    expect(getAtPath(root, ['a', 'missing', 'x'])).toBeUndefined();
  });
});
