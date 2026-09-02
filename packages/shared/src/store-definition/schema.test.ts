import { describe, expect, it } from 'vitest';

import { validStoreDefinitionInput } from '../testing/fixtures.js';
import { storeDefinitionInputSchema } from './store-definition.js';

describe('storeDefinitionInputSchema', () => {
  it('accepts the reference fixture', () => {
    expect(storeDefinitionInputSchema.safeParse(validStoreDefinitionInput()).success).toBe(true);
  });

  it('rejects a non-hex primary colour', () => {
    const input = validStoreDefinitionInput();
    input.theme.colors.primary = 'black';
    expect(storeDefinitionInputSchema.safeParse(input).success).toBe(false);
  });

  it('rejects an out-of-range grid column count', () => {
    const input = validStoreDefinitionInput();
    const section = input.pages[0]!.sections[1]! as { type: string; columns: number };
    section.columns = 6;
    expect(storeDefinitionInputSchema.safeParse(input).success).toBe(false);
  });

  it('rejects an unknown section type', () => {
    const input = validStoreDefinitionInput();
    (input.pages[0]!.sections[0] as { type: string }).type = 'carousel';
    expect(storeDefinitionInputSchema.safeParse(input).success).toBe(false);
  });

  it('rejects a price below the minimum', () => {
    const input = validStoreDefinitionInput();
    input.products[0]!.priceMinor = 0;
    expect(storeDefinitionInputSchema.safeParse(input).success).toBe(false);
  });

  it('rejects a url image (no allowlisted hosts in MVP)', () => {
    const input = validStoreDefinitionInput();
    input.products[0]!.image = { kind: 'url', url: 'https://cdn.example.com/a.jpg' };
    expect(storeDefinitionInputSchema.safeParse(input).success).toBe(false);
  });

  it('accepts an external link target to any https host but rejects other schemes', () => {
    const withLink = (url: string) => {
      const input = validStoreDefinitionInput();
      input.navigation.links[0]!.target = { type: 'external', url } as never;
      return storeDefinitionInputSchema.safeParse(input).success;
    };
    expect(withLink('https://instagram.com/maisonoud')).toBe(true);
    expect(withLink('https://anything.example/path?x=1')).toBe(true);
    expect(withLink('http://instagram.com/maisonoud')).toBe(false);
    expect(withLink('javascript:alert(1)')).toBe(false);
  });

  it('rejects fewer than three products', () => {
    const input = validStoreDefinitionInput();
    input.products = input.products.slice(0, 2);
    expect(storeDefinitionInputSchema.safeParse(input).success).toBe(false);
  });
});
