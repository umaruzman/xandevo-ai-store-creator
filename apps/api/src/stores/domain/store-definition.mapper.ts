import {
  type AnnouncementBar,
  type Category,
  type Footer,
  type LinkTarget,
  type Navigation,
  type Page,
  type Product,
  type Section,
  type SectionLayout,
  type StoreDefinition,
  storeDefinitionSchema,
  type Theme,
} from '@xandevo/shared';

/**
 * Plain, DB-shaped rows the mapper is responsible for. Timestamps, `userId`, and
 * the parent `storeId` on the store row itself are the repository's concern
 * (Phase 9) — not modelled here, which keeps the mapper pure and DB-free.
 */
export interface StoreRow {
  id: string;
  name: string;
  slug: string;
  tagline: string | null;
  locale: string;
  currency: string;
  status: 'draft' | 'saved';
  promptText: string;
  promptVersion: string;
  schemaVersion: number;
  theme: Theme;
  navigation: Navigation;
  header: StoreDefinition['header'];
  footer: Footer;
  announcementBar: AnnouncementBar | null;
}
export interface PageRow {
  id: string;
  storeId: string;
  slug: string;
  title: string;
  position: number;
}
export interface SectionRow {
  id: string;
  pageId: string;
  type: Section['type'];
  position: number;
  background: string;
  container: string;
  paddingY: string;
  align: string;
}
export interface HeroSectionRow {
  sectionId: string;
  headline: string;
  subheadline: string | null;
  description: string;
  heroLayout: string;
  height: string;
  overlayStrength: number;
  ctaLabel: string;
  ctaTargetType: LinkTarget['type'];
  ctaTargetPageId: string | null;
  ctaTargetSectionId: string | null;
  ctaTargetUrl: string | null;
}
export interface CategoriesSectionRow {
  sectionId: string;
  title: string | null;
  categoriesLayout: string;
  columns: number;
}
export interface ProductGridSectionRow {
  sectionId: string;
  title: string | null;
  productGridLayout: string;
  columns: number;
  limit: number | null;
  cardVariant: unknown | null;
  showViewAll: boolean;
  categoryId: string | null;
}
export interface RichTextSectionRow {
  sectionId: string;
  title: string | null;
  body: string;
  width: string;
}
export interface ContactSectionRow {
  sectionId: string;
  title: string | null;
  description: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  showForm: boolean;
  contactLayout: string;
}
export interface CtaSectionRow {
  sectionId: string;
  headline: string;
  description: string | null;
  ctaLayout: string;
  emphasis: string;
  buttonLabel: string;
  buttonTargetType: LinkTarget['type'];
  buttonTargetPageId: string | null;
  buttonTargetSectionId: string | null;
  buttonTargetUrl: string | null;
}
export interface SectionItemRow {
  sectionId: string;
  position: number;
}
export interface CategoriesSectionItemRow extends SectionItemRow {
  categoryId: string;
}
export interface ProductGridSectionItemRow extends SectionItemRow {
  productId: string;
}
export interface CategoryRow {
  id: string;
  storeId: string;
  name: string;
  slug: string;
  description: string | null;
  accentColor: string | null;
  position: number;
}
export interface ProductRow {
  id: string;
  storeId: string;
  categoryId: string;
  name: string;
  slug: string;
  description: string;
  priceMinor: number;
  currency: string;
  imageKind: 'placeholder' | 'url';
  imageRef: string;
  imageStyle: string | null;
  featured: boolean;
  badge: 'new' | 'limited' | 'bestseller' | null;
  position: number;
}

export interface StoreAggregateRows {
  store: StoreRow;
  pages: PageRow[];
  sections: SectionRow[];
  heroSections: HeroSectionRow[];
  categoriesSections: CategoriesSectionRow[];
  productGridSections: ProductGridSectionRow[];
  richTextSections: RichTextSectionRow[];
  contactSections: ContactSectionRow[];
  ctaSections: CtaSectionRow[];
  categoriesSectionItems: CategoriesSectionItemRow[];
  productGridSectionItems: ProductGridSectionItemRow[];
  categories: CategoryRow[];
  products: ProductRow[];
}

const nullify = <T>(v: T | undefined): T | null => (v === undefined ? null : v);
const undefinedify = <T>(v: T | null): T | undefined => (v === null ? undefined : v);

// ── Link target column <-> LinkTarget ─────────────────────────────────────
interface TargetColumns {
  type: LinkTarget['type'];
  pageId: string | null;
  sectionId: string | null;
  url: string | null;
}
function targetToColumns(target: LinkTarget): TargetColumns {
  return {
    type: target.type,
    pageId: target.type === 'page' ? target.pageId : null,
    sectionId: target.type === 'section' ? target.sectionId : null,
    url: target.type === 'external' ? target.url : null,
  };
}
function columnsToTarget(c: {
  type: LinkTarget['type'];
  pageId: string | null;
  sectionId: string | null;
  url: string | null;
}): LinkTarget {
  switch (c.type) {
    case 'page':
      return { type: 'page', pageId: c.pageId ?? '' };
    case 'section':
      return { type: 'section', sectionId: c.sectionId ?? '' };
    case 'external':
      return { type: 'external', url: c.url ?? '' };
    case 'none':
      return { type: 'none' };
  }
}

/**
 * Decompose a trusted, normalized Store Definition into the relational rows for
 * one store aggregate. `storeId` wires the parent FKs. Pure: no DB access, no
 * timestamps. Round-trips with `toDefinition` (identity after normalization).
 */
export function toRows(definition: StoreDefinition, storeId: string): StoreAggregateRows {
  const rows: StoreAggregateRows = {
    store: {
      id: storeId,
      name: definition.meta.name,
      slug: slugify(definition.meta.name),
      tagline: nullify(definition.meta.tagline),
      locale: definition.meta.locale,
      currency: definition.meta.currency,
      status: 'draft',
      promptText: '',
      promptVersion: '',
      schemaVersion: definition.schemaVersion,
      theme: definition.theme,
      navigation: definition.navigation,
      header: definition.header,
      footer: definition.footer,
      announcementBar: nullify(definition.announcementBar),
    },
    pages: [],
    sections: [],
    heroSections: [],
    categoriesSections: [],
    productGridSections: [],
    richTextSections: [],
    contactSections: [],
    ctaSections: [],
    categoriesSectionItems: [],
    productGridSectionItems: [],
    categories: definition.categories.map((c) => ({
      id: c.id,
      storeId,
      name: c.name,
      slug: c.slug,
      description: nullify(c.description),
      accentColor: nullify(c.accentColor),
      position: c.order,
    })),
    products: definition.products.map((p) => ({
      id: p.id,
      storeId,
      categoryId: p.categoryId,
      name: p.name,
      slug: p.slug,
      description: p.description,
      priceMinor: p.priceMinor,
      currency: p.currency,
      imageKind: p.image.kind,
      imageRef: p.image.kind === 'placeholder' ? p.image.seed : p.image.url,
      imageStyle: nullify(p.image.style),
      featured: p.featured,
      badge: nullify(p.badge),
      position: p.order,
    })),
  };

  for (const page of definition.pages) {
    rows.pages.push({
      id: page.id,
      storeId,
      slug: page.slug,
      title: page.title,
      position: page.order,
    });
    for (const section of page.sections) {
      rows.sections.push({
        id: section.id,
        pageId: page.id,
        type: section.type,
        position: section.order,
        background: section.layout.background,
        container: section.layout.container,
        paddingY: section.layout.paddingY,
        align: section.layout.align,
      });
      addTypeRow(rows, section);
    }
  }

  return rows;
}

function addTypeRow(rows: StoreAggregateRows, section: Section): void {
  switch (section.type) {
    case 'hero': {
      const t = targetToColumns(section.cta.target);
      rows.heroSections.push({
        sectionId: section.id,
        headline: section.headline,
        subheadline: nullify(section.subheadline),
        description: section.description,
        heroLayout: section.heroLayout,
        height: section.height,
        overlayStrength: section.overlayStrength,
        ctaLabel: section.cta.label,
        ctaTargetType: t.type,
        ctaTargetPageId: t.pageId,
        ctaTargetSectionId: t.sectionId,
        ctaTargetUrl: t.url,
      });
      return;
    }
    case 'categories': {
      rows.categoriesSections.push({
        sectionId: section.id,
        title: nullify(section.title),
        categoriesLayout: section.categoriesLayout,
        columns: section.columns,
      });
      section.categoryIds.forEach((categoryId, position) =>
        rows.categoriesSectionItems.push({ sectionId: section.id, categoryId, position }),
      );
      return;
    }
    case 'productGrid': {
      rows.productGridSections.push({
        sectionId: section.id,
        title: nullify(section.title),
        productGridLayout: section.productGridLayout,
        columns: section.columns,
        limit: nullify(section.limit),
        cardVariant: nullify(section.cardVariant),
        showViewAll: section.showViewAll,
        categoryId: nullify(section.categoryId),
      });
      section.productIds?.forEach((productId, position) =>
        rows.productGridSectionItems.push({ sectionId: section.id, productId, position }),
      );
      return;
    }
    case 'richText': {
      rows.richTextSections.push({
        sectionId: section.id,
        title: nullify(section.title),
        body: section.body,
        width: section.width,
      });
      return;
    }
    case 'contact': {
      rows.contactSections.push({
        sectionId: section.id,
        title: nullify(section.title),
        description: nullify(section.description),
        email: nullify(section.email),
        phone: nullify(section.phone),
        address: nullify(section.address),
        showForm: section.showForm,
        contactLayout: section.contactLayout,
      });
      return;
    }
    case 'cta': {
      const t = targetToColumns(section.button.target);
      rows.ctaSections.push({
        sectionId: section.id,
        headline: section.headline,
        description: nullify(section.description),
        ctaLayout: section.ctaLayout,
        emphasis: section.emphasis,
        buttonLabel: section.button.label,
        buttonTargetType: t.type,
        buttonTargetPageId: t.pageId,
        buttonTargetSectionId: t.sectionId,
        buttonTargetUrl: t.url,
      });
      return;
    }
    default: {
      const exhaustive: never = section;
      throw new Error(`unknown section type: ${JSON.stringify(exhaustive)}`);
    }
  }
}

/**
 * Reassemble store-aggregate rows into a Store Definition and validate it against
 * `storeDefinitionSchema`. Inverse of `toRows`.
 */
export function toDefinition(rows: StoreAggregateRows): StoreDefinition {
  const byPosition = <T extends { position: number }>(a: T, b: T): number =>
    a.position - b.position;
  const one = <T>(list: T[], match: (r: T) => boolean, what: string): T => {
    const found = list.find(match);
    if (!found) throw new Error(`missing ${what} row`);
    return found;
  };

  const layoutOf = (s: SectionRow): SectionLayout =>
    ({
      background: s.background,
      container: s.container,
      paddingY: s.paddingY,
      align: s.align,
    }) as SectionLayout;

  const pages: Page[] = [...rows.pages].sort(byPosition).map((page) => ({
    id: page.id,
    slug: page.slug,
    title: page.title,
    order: page.position,
    sections: rows.sections
      .filter((s) => s.pageId === page.id)
      .sort(byPosition)
      .map((s): Section => reassembleSection(rows, s, layoutOf(s), one)),
  }));

  const categories: Category[] = [...rows.categories].sort(byPosition).map((c) => ({
    id: c.id,
    order: c.position,
    name: c.name,
    slug: c.slug,
    description: undefinedify(c.description),
    accentColor: undefinedify(c.accentColor),
  }));

  const products: Product[] = [...rows.products].sort(byPosition).map((p) => ({
    id: p.id,
    order: p.position,
    name: p.name,
    slug: p.slug,
    description: p.description,
    priceMinor: p.priceMinor,
    currency: p.currency,
    categoryId: p.categoryId,
    featured: p.featured,
    badge: undefinedify(p.badge),
    image:
      p.imageKind === 'placeholder'
        ? { kind: 'placeholder', seed: p.imageRef, style: undefinedify(p.imageStyle) as never }
        : { kind: 'url', url: p.imageRef, style: undefinedify(p.imageStyle) as never },
  }));

  const candidate: StoreDefinition = {
    schemaVersion: rows.store.schemaVersion,
    id: rows.store.id,
    meta: {
      name: rows.store.name,
      tagline: undefinedify(rows.store.tagline),
      locale: rows.store.locale,
      currency: rows.store.currency,
    },
    theme: rows.store.theme,
    navigation: rows.store.navigation,
    header: rows.store.header,
    footer: rows.store.footer,
    announcementBar: undefinedify(rows.store.announcementBar),
    pages,
    categories,
    products,
  };

  return storeDefinitionSchema.parse(candidate);
}

function reassembleSection(
  rows: StoreAggregateRows,
  base: SectionRow,
  layout: SectionLayout,
  one: <T>(list: T[], match: (r: T) => boolean, what: string) => T,
): Section {
  const id = base.id;
  const common = { id, order: base.position, layout };
  switch (base.type) {
    case 'hero': {
      const h = one(rows.heroSections, (r) => r.sectionId === id, 'hero_sections');
      return {
        ...common,
        type: 'hero',
        headline: h.headline,
        subheadline: undefinedify(h.subheadline),
        description: h.description,
        heroLayout: h.heroLayout as never,
        height: h.height as never,
        overlayStrength: h.overlayStrength,
        cta: {
          label: h.ctaLabel,
          target: columnsToTarget({
            type: h.ctaTargetType,
            pageId: h.ctaTargetPageId,
            sectionId: h.ctaTargetSectionId,
            url: h.ctaTargetUrl,
          }),
        },
      };
    }
    case 'categories': {
      const c = one(rows.categoriesSections, (r) => r.sectionId === id, 'categories_sections');
      return {
        ...common,
        type: 'categories',
        title: undefinedify(c.title),
        categoriesLayout: c.categoriesLayout as never,
        columns: c.columns as never,
        categoryIds: rows.categoriesSectionItems
          .filter((r) => r.sectionId === id)
          .sort((a, b) => a.position - b.position)
          .map((r) => r.categoryId),
      };
    }
    case 'productGrid': {
      const g = one(rows.productGridSections, (r) => r.sectionId === id, 'product_grid_sections');
      const productIds = rows.productGridSectionItems
        .filter((r) => r.sectionId === id)
        .sort((a, b) => a.position - b.position)
        .map((r) => r.productId);
      return {
        ...common,
        type: 'productGrid',
        title: undefinedify(g.title),
        productGridLayout: g.productGridLayout as never,
        columns: g.columns as never,
        limit: undefinedify(g.limit),
        cardVariant: (g.cardVariant ?? undefined) as never,
        showViewAll: g.showViewAll,
        categoryId: undefinedify(g.categoryId),
        productIds: productIds.length > 0 ? productIds : undefined,
      };
    }
    case 'richText': {
      const r = one(rows.richTextSections, (x) => x.sectionId === id, 'rich_text_sections');
      return {
        ...common,
        type: 'richText',
        title: undefinedify(r.title),
        body: r.body,
        width: r.width as never,
      };
    }
    case 'contact': {
      const c = one(rows.contactSections, (r) => r.sectionId === id, 'contact_sections');
      return {
        ...common,
        type: 'contact',
        title: undefinedify(c.title),
        description: undefinedify(c.description),
        email: undefinedify(c.email),
        phone: undefinedify(c.phone),
        address: undefinedify(c.address),
        showForm: c.showForm,
        contactLayout: c.contactLayout as never,
      };
    }
    case 'cta': {
      const c = one(rows.ctaSections, (r) => r.sectionId === id, 'cta_sections');
      return {
        ...common,
        type: 'cta',
        headline: c.headline,
        description: undefinedify(c.description),
        ctaLayout: c.ctaLayout as never,
        emphasis: c.emphasis as never,
        button: {
          label: c.buttonLabel,
          target: columnsToTarget({
            type: c.buttonTargetType,
            pageId: c.buttonTargetPageId,
            sectionId: c.buttonTargetSectionId,
            url: c.buttonTargetUrl,
          }),
        },
      };
    }
    default: {
      const exhaustive: never = base.type;
      throw new Error(`unknown section type: ${String(exhaustive)}`);
    }
  }
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}
