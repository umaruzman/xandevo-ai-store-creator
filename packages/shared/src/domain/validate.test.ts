import { describe, expect, it } from 'vitest';

import { validStoreDefinitionInput } from '../testing/fixtures.js';
import { StoreDefinitionError } from './errors.js';
import { assertBusinessRules } from './validate.js';

const expectBusinessFailure = (
  mutate: (input: ReturnType<typeof validStoreDefinitionInput>) => void,
  pathFragment: string,
) => {
  const input = validStoreDefinitionInput();
  mutate(input);
  try {
    assertBusinessRules(input);
    throw new Error('expected assertBusinessRules to throw');
  } catch (err) {
    expect(err).toBeInstanceOf(StoreDefinitionError);
    const issues = (err as StoreDefinitionError).issues;
    expect(issues.some((i) => i.path.includes(pathFragment))).toBe(true);
  }
};

describe('assertBusinessRules', () => {
  it('passes for the reference fixture', () => {
    expect(() => assertBusinessRules(validStoreDefinitionInput())).not.toThrow();
  });

  it('rejects a category with no products', () => {
    expectBusinessFailure((input) => {
      input.categories.push({ name: 'Empty', slug: 'empty' });
    }, 'categories');
  });

  it('rejects a product currency that differs from meta.currency', () => {
    expectBusinessFailure((input) => {
      input.products[0]!.currency = 'USD';
    }, 'products.0.currency');
  });

  it('rejects a missing required page', () => {
    expectBusinessFailure((input) => {
      input.pages = input.pages.filter((p) => p.slug !== 'contact');
    }, 'pages');
  });

  it('rejects a home page that does not start with a hero', () => {
    expectBusinessFailure((input) => {
      const home = input.pages.find((p) => p.slug === 'home')!;
      home.sections.reverse();
    }, 'pages.home.sections.0');
  });

  it('rejects a section referencing an unknown category', () => {
    expectBusinessFailure((input) => {
      const section = input.pages[0]!.sections[1]!;
      if (section.type === 'categories') section.categorySlugs.push('ghost');
    }, 'categorySlugs');
  });

  it('rejects a link target pointing at an unknown page', () => {
    expectBusinessFailure((input) => {
      input.navigation.links[0]!.target = { type: 'page', slug: 'missing' };
    }, 'navigation.links.0.target');
  });

  it('rejects a duplicate product slug', () => {
    expectBusinessFailure((input) => {
      input.products[1]!.slug = input.products[0]!.slug;
    }, 'products.1.slug');
  });
});
