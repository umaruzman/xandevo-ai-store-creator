import { REQUIRED_PAGE_SLUGS } from '../store-definition/page.js';
import {
  storeDefinitionSchema,
  type StoreDefinition,
} from '../store-definition/store-definition.js';
import { type FieldIssue, StoreDefinitionError } from './errors.js';
import { cleanStrings } from './sanitize.js';
import { zodIssuesToFieldIssues } from './schema-issues.js';

/**
 * Business rules for a NORMALIZED definition (id-based references) — what the
 * editor produces and `POST`/`PATCH /stores` persist. Mirrors
 * `assertBusinessRules` (which works on the slug-based input form).
 */
export function assertNormalizedBusinessRules(def: StoreDefinition): void {
  const issues: FieldIssue[] = [];
  const add = (path: string, message: string) => issues.push({ path, message });

  const categoryIds = new Set(def.categories.map((c) => c.id));
  const productIds = new Set(def.products.map((p) => p.id));
  const pageIds = new Set(def.pages.map((p) => p.id));
  const allSectionIds = new Set(def.pages.flatMap((p) => p.sections.map((s) => s.id)));

  const seenCatSlug = new Set<string>();
  def.categories.forEach((c, i) => {
    if (seenCatSlug.has(c.slug)) add(`categories.${i}.slug`, `duplicate category slug "${c.slug}"`);
    seenCatSlug.add(c.slug);
  });

  const usedCats = new Set<string>();
  const seenProdSlug = new Set<string>();
  def.products.forEach((p, i) => {
    if (seenProdSlug.has(p.slug)) add(`products.${i}.slug`, `duplicate product slug "${p.slug}"`);
    seenProdSlug.add(p.slug);
    if (p.currency !== def.meta.currency) {
      add(`products.${i}.currency`, `must match meta.currency (${def.meta.currency})`);
    }
    if (!categoryIds.has(p.categoryId)) add(`products.${i}.categoryId`, 'unknown category');
    else usedCats.add(p.categoryId);
  });
  def.categories.forEach((c, i) => {
    if (!usedCats.has(c.id)) add(`categories.${i}`, `category "${c.slug}" has no products`);
  });

  const pageSlugs = new Set(def.pages.map((p) => p.slug));
  for (const required of REQUIRED_PAGE_SLUGS) {
    if (!pageSlugs.has(required)) add('pages', `missing required page "${required}"`);
  }
  const home = def.pages.find((p) => p.slug === 'home');
  if (home) {
    const first = [...home.sections].sort((a, b) => a.order - b.order)[0];
    if (first?.type !== 'hero')
      add('pages.home.sections.0', 'the home page must start with a hero');
  }

  const checkTarget = (
    path: string,
    target: { type: string; pageId?: string; sectionId?: string },
  ) => {
    if (target.type === 'page' && target.pageId && !pageIds.has(target.pageId)) {
      add(path, 'link target references an unknown page');
    }
    if (target.type === 'section' && target.sectionId && !allSectionIds.has(target.sectionId)) {
      add(path, 'link target references an unknown section');
    }
  };

  def.pages.forEach((page, pi) => {
    const orders = new Set<number>();
    page.sections.forEach((section, si) => {
      const base = `pages.${pi}.sections.${si}`;
      if (orders.has(section.order)) add(`${base}.order`, 'duplicate section order in page');
      orders.add(section.order);
      if (section.type === 'hero') checkTarget(`${base}.cta.target`, section.cta.target);
      if (section.type === 'cta') checkTarget(`${base}.button.target`, section.button.target);
      if (section.type === 'categories') {
        section.categoryIds.forEach((id, i) => {
          if (!categoryIds.has(id)) add(`${base}.categoryIds.${i}`, 'unknown category');
        });
      }
      if (section.type === 'productGrid') {
        if (section.categoryId && !categoryIds.has(section.categoryId)) {
          add(`${base}.categoryId`, 'unknown category');
        }
        section.productIds?.forEach((id, i) => {
          if (!productIds.has(id)) add(`${base}.productIds.${i}`, 'unknown product');
        });
      }
    });
  });

  def.navigation.links.forEach((l, i) => checkTarget(`navigation.links.${i}.target`, l.target));
  def.footer.columns.forEach((c, ci) =>
    c.links.forEach((l, li) => checkTarget(`footer.columns.${ci}.links.${li}.target`, l.target)),
  );
  if (def.announcementBar?.link) checkTarget('announcementBar.link', def.announcementBar.link);

  if (issues.length > 0) throw StoreDefinitionError.business(issues);
}

/**
 * Full server-side re-validation of an untrusted NORMALIZED definition
 * (`POST`/`PATCH /stores`): schema → sanitize → schema → business rules.
 * Returns the trusted definition; throws `StoreDefinitionError`.
 */
export function validateStoreDefinition(raw: unknown): StoreDefinition {
  const first = storeDefinitionSchema.safeParse(raw);
  if (!first.success) {
    throw StoreDefinitionError.schema(zodIssuesToFieldIssues(first.error.issues));
  }
  const cleaned = storeDefinitionSchema.safeParse(cleanStrings(first.data));
  if (!cleaned.success) {
    throw new StoreDefinitionError(
      'sanitize',
      'Store Definition became invalid after sanitization',
      zodIssuesToFieldIssues(cleaned.error.issues),
    );
  }
  assertNormalizedBusinessRules(cleaned.data);
  return cleaned.data;
}
