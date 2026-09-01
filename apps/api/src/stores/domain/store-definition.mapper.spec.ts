import {
  buildStoreDefinition,
  type StoreDefinition,
  validStoreDefinitionInput,
} from '@xandevo/shared';

import { type StoreAggregateRows, toDefinition, toRows } from './store-definition.mapper';

const STORE_ID = '11111111-1111-4111-8111-111111111111';

let seq = 0;
const idFactory = (): string => {
  seq += 1;
  return `00000000-0000-4000-8000-${String(seq).padStart(12, '0')}`;
};

const buildDefinition = (): StoreDefinition => {
  seq = 0;
  return buildStoreDefinition(validStoreDefinitionInput(), { idFactory });
};

describe('store-definition.mapper', () => {
  it('round-trips a normalized definition (identity)', () => {
    const def = buildDefinition();
    const back = toDefinition(toRows(def, STORE_ID));
    expect(back).toEqual({ ...def, id: STORE_ID });
  });

  it('produces rows whose foreign keys all resolve within the aggregate', () => {
    const rows = toRows(buildDefinition(), STORE_ID);
    const pageIds = new Set(rows.pages.map((p) => p.id));
    const sectionIds = new Set(rows.sections.map((s) => s.id));
    const categoryIds = new Set(rows.categories.map((c) => c.id));
    const productIds = new Set(rows.products.map((p) => p.id));

    for (const s of rows.sections) expect(pageIds.has(s.pageId)).toBe(true);
    for (const h of rows.heroSections) {
      expect(sectionIds.has(h.sectionId)).toBe(true);
      if (h.ctaTargetPageId) expect(pageIds.has(h.ctaTargetPageId)).toBe(true);
    }
    for (const p of rows.products) expect(categoryIds.has(p.categoryId)).toBe(true);
    for (const it of rows.categoriesSectionItems) expect(categoryIds.has(it.categoryId)).toBe(true);
    for (const it of rows.productGridSectionItems) expect(productIds.has(it.productId)).toBe(true);
    for (const store of [rows.store]) expect(store.id).toBe(STORE_ID);
  });

  it('applies a single-field edit as a minimal row diff', () => {
    const before = toRows(buildDefinition(), STORE_ID);

    const edited = buildDefinition();
    const hero = edited.pages[0]!.sections[0]!;
    if (hero.type === 'hero') hero.headline = 'A Different Headline';
    const after = toRows(edited, STORE_ID);

    // Everything except the hero content row is byte-identical.
    expect(after.pages).toEqual(before.pages);
    expect(after.sections).toEqual(before.sections);
    expect(after.categories).toEqual(before.categories);
    expect(after.products).toEqual(before.products);
    expect(after.categoriesSectionItems).toEqual(before.categoriesSectionItems);
    expect(after.productGridSectionItems).toEqual(before.productGridSectionItems);

    // The hero row differs only in `headline`.
    expect(after.heroSections).toHaveLength(before.heroSections.length);
    const [a, b] = [after.heroSections[0]!, before.heroSections[0]!];
    expect(a.headline).toBe('A Different Headline');
    expect({ ...a, headline: b.headline }).toEqual(b);
  });

  it('maps link targets to structured columns and back', () => {
    const rows: StoreAggregateRows = toRows(buildDefinition(), STORE_ID);
    const heroRow = rows.heroSections[0]!;
    expect(heroRow.ctaTargetType).toBe('page');
    expect(heroRow.ctaTargetPageId).toBe(rows.pages.find((p) => p.slug === 'home')!.id);
    expect(heroRow.ctaTargetUrl).toBeNull();
  });
});
