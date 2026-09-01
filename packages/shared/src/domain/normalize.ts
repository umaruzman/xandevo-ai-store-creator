import { type Category, type Product } from '../store-definition/catalog.js';
import { type AnnouncementBar, type Footer, type Navigation } from '../store-definition/chrome.js';
import { type Page, REQUIRED_PAGE_SLUGS } from '../store-definition/page.js';
import { type Section, type SectionLayout } from '../store-definition/sections.js';
import {
  CURRENT_SCHEMA_VERSION,
  storeDefinitionSchema,
  type StoreDefinition,
  type StoreDefinitionInput,
  type ThemeInput,
} from '../store-definition/store-definition.js';
import { type LinkTarget, type LinkTargetInput } from '../store-definition/targets.js';
import { PRESET_DEFAULTS, type Theme } from '../store-definition/theme.js';
import { StoreDefinitionError } from './errors.js';
import { zodIssuesToFieldIssues } from './schema-issues.js';

export interface NormalizeOptions {
  /** Injectable for deterministic tests. Defaults to a UUID generator. */
  idFactory?: () => string;
}

const defaultIdFactory = (): string => {
  const c = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;
  if (c?.randomUUID) return c.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (ch) => {
    const r = (Math.random() * 16) | 0;
    return (ch === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
};

const SECTION_LAYOUT_DEFAULT: SectionLayout = {
  background: 'surface',
  container: 'boxed',
  paddingY: 'md',
  align: 'left',
};

function resolveTheme(input: ThemeInput): Theme {
  const d = PRESET_DEFAULTS[input.preset]!;
  return {
    preset: input.preset,
    colors: input.colors,
    typography: { ...d.typography, ...input.typography },
    style: { ...d.style, ...input.style },
    components: {
      productCard: { ...d.components.productCard, ...input.components?.productCard },
      button: { ...d.components.button, ...input.components?.button },
      categoryCard: { ...d.components.categoryCard, ...input.components?.categoryCard },
    },
  };
}

function orderPages(pages: StoreDefinitionInput['pages']): StoreDefinitionInput['pages'] {
  const required = new Set<string>(REQUIRED_PAGE_SLUGS);
  const canonical = REQUIRED_PAGE_SLUGS.map((s) => pages.find((p) => p.slug === s)).filter(
    (p): p is StoreDefinitionInput['pages'][number] => p !== undefined,
  );
  return [...canonical, ...pages.filter((p) => !required.has(p.slug))];
}

function mustGet(map: Map<string, string>, key: string, what: string): string {
  const value = map.get(key);
  if (value === undefined) {
    throw new StoreDefinitionError(
      'normalize',
      `could not resolve reference for ${what}: "${key}"`,
    );
  }
  return value;
}

/**
 * Turn a validated, sanitized `StoreDefinitionInput` into a trusted, id-bearing,
 * reference-resolved `StoreDefinition`:
 *  - assigns a UUID to every page, section, category and product
 *  - resolves slug references to ids (categories, products, link targets)
 *  - renumbers `order` 0..n (canonical pages first), fills section layout and
 *    theme defaults from the chosen preset
 *  - stamps `schemaVersion`
 * The result is re-validated against `storeDefinitionSchema`.
 */
export function normalizeStoreDefinition(
  input: StoreDefinitionInput,
  options: NormalizeOptions = {},
): StoreDefinition {
  const newId = options.idFactory ?? defaultIdFactory;

  const categories: Category[] = input.categories.map((cat, order) => ({
    id: newId(),
    order,
    ...cat,
  }));
  const categoryIdBySlug = new Map(categories.map((c) => [c.slug, c.id]));

  const products: Product[] = input.products.map(({ categorySlug, ...rest }, order) => ({
    id: newId(),
    order,
    ...rest,
    categoryId: mustGet(categoryIdBySlug, categorySlug, `product "${rest.slug}" category`),
  }));
  const productIdBySlug = new Map(products.map((p) => [p.slug, p.id]));

  const orderedPages = orderPages(input.pages);
  const pageIds = orderedPages.map(() => newId());
  const pageIdBySlug = new Map(orderedPages.map((p, i) => [p.slug, pageIds[i]!]));

  const resolveTarget = (target: LinkTargetInput, path: string): LinkTarget =>
    target.type === 'page'
      ? { type: 'page', pageId: mustGet(pageIdBySlug, target.slug, `${path} page`) }
      : target;

  const normalizeSection = (
    section: StoreDefinitionInput['pages'][number]['sections'][number],
    order: number,
  ): Section => {
    const layout: SectionLayout = { ...SECTION_LAYOUT_DEFAULT, ...section.layout };
    const id = newId();
    switch (section.type) {
      case 'hero':
        return {
          ...section,
          id,
          order,
          layout,
          cta: { label: section.cta.label, target: resolveTarget(section.cta.target, 'hero.cta') },
        };
      case 'categories': {
        const { categorySlugs, ...rest } = section;
        return {
          ...rest,
          id,
          order,
          layout,
          categoryIds: categorySlugs.map((s) => mustGet(categoryIdBySlug, s, 'categories section')),
        };
      }
      case 'productGrid': {
        const { categorySlug, productSlugs, ...rest } = section;
        return {
          ...rest,
          id,
          order,
          layout,
          categoryId: categorySlug
            ? mustGet(categoryIdBySlug, categorySlug, 'productGrid section')
            : undefined,
          productIds: productSlugs?.map((s) => mustGet(productIdBySlug, s, 'productGrid section')),
        };
      }
      case 'richText':
        return { ...section, id, order, layout };
      case 'contact':
        return { ...section, id, order, layout };
      case 'cta':
        return {
          ...section,
          id,
          order,
          layout,
          button: {
            label: section.button.label,
            target: resolveTarget(section.button.target, 'cta.button'),
          },
        };
      default: {
        const exhaustive: never = section;
        throw new StoreDefinitionError(
          'normalize',
          `unknown section type: ${JSON.stringify(exhaustive)}`,
        );
      }
    }
  };

  const pages: Page[] = orderedPages.map((page, order) => ({
    id: pageIds[order]!,
    slug: page.slug,
    title: page.title,
    order,
    sections: page.sections.map(normalizeSection),
  }));

  const navigation: Navigation = {
    links: input.navigation.links.map((link, i) => ({
      label: link.label,
      target: resolveTarget(link.target, `navigation.links.${i}`),
    })),
  };
  const footer: Footer = {
    columns: input.footer.columns.map((col, ci) => ({
      title: col.title,
      links: col.links.map((link, li) => ({
        label: link.label,
        target: resolveTarget(link.target, `footer.columns.${ci}.links.${li}`),
      })),
    })),
    social: input.footer.social,
    showPaymentIcons: input.footer.showPaymentIcons,
    showNewsletter: input.footer.showNewsletter,
  };
  const announcementBar: AnnouncementBar | undefined = input.announcementBar
    ? {
        text: input.announcementBar.text,
        link: input.announcementBar.link
          ? resolveTarget(input.announcementBar.link, 'announcementBar.link')
          : undefined,
        tone: input.announcementBar.tone,
        dismissible: input.announcementBar.dismissible,
      }
    : undefined;

  const candidate: StoreDefinition = {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    meta: input.meta,
    theme: resolveTheme(input.theme),
    navigation,
    header: input.header,
    footer,
    announcementBar,
    pages,
    categories,
    products,
  };

  const parsed = storeDefinitionSchema.safeParse(candidate);
  if (!parsed.success) {
    throw new StoreDefinitionError(
      'normalize',
      'normalized Store Definition failed validation',
      zodIssuesToFieldIssues(parsed.error.issues),
    );
  }
  return parsed.data;
}
