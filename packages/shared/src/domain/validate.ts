import { REQUIRED_PAGE_SLUGS } from '../store-definition/page.js';
import { type StoreDefinitionInput } from '../store-definition/store-definition.js';
import { type FieldIssue, StoreDefinitionError } from './errors.js';

/**
 * Business rules that the Zod schema cannot express: reference resolvability,
 * cross-field consistency, and catalogue coverage. Runs on a schema-valid input.
 * Throws `StoreDefinitionError('business', …)` with every issue found.
 */
export function assertBusinessRules(input: StoreDefinitionInput): void {
  const issues: FieldIssue[] = [];
  const add = (path: string, message: string): void => {
    issues.push({ path, message });
  };

  // ── Catalogue ────────────────────────────────────────────────────────────
  const categorySlugs = new Set<string>();
  input.categories.forEach((cat, i) => {
    if (categorySlugs.has(cat.slug))
      add(`categories.${i}.slug`, `duplicate category slug "${cat.slug}"`);
    categorySlugs.add(cat.slug);
  });

  const productSlugs = new Set<string>();
  const usedCategorySlugs = new Set<string>();
  input.products.forEach((prod, i) => {
    if (productSlugs.has(prod.slug))
      add(`products.${i}.slug`, `duplicate product slug "${prod.slug}"`);
    productSlugs.add(prod.slug);
    if (prod.currency !== input.meta.currency) {
      add(`products.${i}.currency`, `must match meta.currency (${input.meta.currency})`);
    }
    if (!categorySlugs.has(prod.categorySlug)) {
      add(`products.${i}.categorySlug`, `unknown category "${prod.categorySlug}"`);
    } else {
      usedCategorySlugs.add(prod.categorySlug);
    }
  });

  input.categories.forEach((cat, i) => {
    if (!usedCategorySlugs.has(cat.slug)) {
      add(`categories.${i}`, `category "${cat.slug}" has no products`);
    }
  });

  // ── Pages ────────────────────────────────────────────────────────────────
  const pageSlugs = new Set<string>();
  input.pages.forEach((page, i) => {
    if (pageSlugs.has(page.slug)) add(`pages.${i}.slug`, `duplicate page slug "${page.slug}"`);
    pageSlugs.add(page.slug);
  });
  for (const required of REQUIRED_PAGE_SLUGS) {
    if (!pageSlugs.has(required)) add('pages', `missing required page "${required}"`);
  }
  const home = input.pages.find((p) => p.slug === 'home');
  if (home && home.sections[0]?.type !== 'hero') {
    add('pages.home.sections.0', 'the home page must start with a hero section');
  }

  // ── Section & chrome references ──────────────────────────────────────────
  const checkPageTarget = (path: string, target: { type: string; slug?: string }): void => {
    if (target.type === 'page' && target.slug && !pageSlugs.has(target.slug)) {
      add(path, `link target references unknown page "${target.slug}"`);
    }
  };

  input.navigation.links.forEach((link, i) =>
    checkPageTarget(`navigation.links.${i}.target`, link.target),
  );
  input.footer.columns.forEach((col, ci) =>
    col.links.forEach((link, li) =>
      checkPageTarget(`footer.columns.${ci}.links.${li}.target`, link.target),
    ),
  );
  if (input.announcementBar?.link) {
    checkPageTarget('announcementBar.link', input.announcementBar.link);
  }

  input.pages.forEach((page, pi) => {
    page.sections.forEach((section, si) => {
      const base = `pages.${pi}.sections.${si}`;
      if (section.type === 'hero') checkPageTarget(`${base}.cta.target`, section.cta.target);
      if (section.type === 'cta') checkPageTarget(`${base}.button.target`, section.button.target);
      if (section.type === 'categories') {
        section.categorySlugs.forEach((s, i) => {
          if (!categorySlugs.has(s)) add(`${base}.categorySlugs.${i}`, `unknown category "${s}"`);
        });
      }
      if (section.type === 'productGrid') {
        if (section.categorySlug && !categorySlugs.has(section.categorySlug)) {
          add(`${base}.categorySlug`, `unknown category "${section.categorySlug}"`);
        }
        section.productSlugs?.forEach((s, i) => {
          if (!productSlugs.has(s)) add(`${base}.productSlugs.${i}`, `unknown product "${s}"`);
        });
      }
    });
  });

  if (issues.length > 0) throw StoreDefinitionError.business(issues);
}
