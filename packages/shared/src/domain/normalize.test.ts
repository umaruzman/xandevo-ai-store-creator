import { describe, expect, it } from 'vitest';

import { validStoreDefinitionInput } from '../testing/fixtures.js';
import { sequentialIdFactory } from '../testing/ids.js';
import { CURRENT_SCHEMA_VERSION } from '../store-definition/store-definition.js';
import { normalizeStoreDefinition } from './normalize.js';

const normalize = () =>
  normalizeStoreDefinition(validStoreDefinitionInput(), { idFactory: sequentialIdFactory() });

describe('normalizeStoreDefinition', () => {
  it('produces a schema-valid, id-bearing definition', () => {
    const def = normalize();
    expect(def.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
    for (const c of def.categories) expect(c.id).toMatch(/^0{8}-/);
    for (const p of def.products) expect(p.id).toMatch(/^0{8}-/);
    for (const page of def.pages) for (const s of page.sections) expect(s.id).toMatch(/^0{8}-/);
  });

  it('orders pages home, about, contact and numbers them', () => {
    const def = normalize();
    expect(def.pages.map((p) => p.slug)).toEqual(['home', 'about', 'contact']);
    expect(def.pages.map((p) => p.order)).toEqual([0, 1, 2]);
    expect(def.pages[0]!.sections.map((s) => s.order)).toEqual([0, 1, 2, 3]);
  });

  it('resolves category and product slug references to ids', () => {
    const def = normalize();
    const oud = def.categories.find((c) => c.slug === 'oud')!;
    const catSection = def.pages[0]!.sections.find((s) => s.type === 'categories')!;
    if (catSection.type === 'categories') expect(catSection.categoryIds).toContain(oud.id);
    for (const product of def.products) {
      expect(def.categories.some((c) => c.id === product.categoryId)).toBe(true);
    }
  });

  it('resolves link targets from slug to pageId', () => {
    const def = normalize();
    const home = def.pages.find((p) => p.slug === 'home')!;
    const hero = home.sections[0]!;
    expect(hero.type).toBe('hero');
    if (hero.type === 'hero') {
      expect(hero.cta.target).toEqual({ type: 'page', pageId: home.id });
    }
  });

  it('applies preset defaults, keeping explicit overrides', () => {
    const def = normalize();
    // luxury preset default
    expect(def.theme.typography.fontPairing).toBe('serif-sans');
    expect(def.theme.style.shadow).toBe('soft');
    // explicit override in the fixture
    expect(def.theme.style.radius).toBe('sm');
    expect(def.theme.style.spacing).toBe('roomy');
  });

  it('fills missing section layout with defaults', () => {
    const def = normalize();
    expect(def.pages[0]!.sections[0]!.layout).toEqual({
      background: 'surface',
      container: 'boxed',
      paddingY: 'md',
      align: 'left',
    });
  });

  it('is deterministic given a fixed id factory', () => {
    const a = normalizeStoreDefinition(validStoreDefinitionInput(), {
      idFactory: sequentialIdFactory(),
    });
    const b = normalizeStoreDefinition(validStoreDefinitionInput(), {
      idFactory: sequentialIdFactory(),
    });
    expect(a).toEqual(b);
  });
});
