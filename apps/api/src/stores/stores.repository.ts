import { randomUUID } from 'node:crypto';

import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { type StoreDefinition } from '@xandevo/shared';

import { PrismaService } from '../prisma/prisma.service';
import { type StoreAggregateRows, toDefinition, toRows } from './domain/store-definition.mapper';

export interface StoreSummaryRow {
  id: string;
  name: string;
  slug: string;
  status: 'draft' | 'saved';
  updatedAt: Date;
}

export interface StoreRecord {
  id: string;
  name: string;
  slug: string;
  status: 'draft' | 'saved';
  promptVersion: string;
  schemaVersion: number;
  definition: StoreDefinition;
  createdAt: Date;
  updatedAt: Date;
}

const AGGREGATE_INCLUDE = {
  categories: true,
  products: true,
  pages: {
    include: {
      sections: {
        include: {
          hero: true,
          categories: { include: { items: true } },
          productGrid: { include: { items: true } },
          richText: true,
          contact: true,
          cta: true,
        },
      },
    },
  },
} satisfies Prisma.StoreInclude;

type LoadedStore = Prisma.StoreGetPayload<{ include: typeof AGGREGATE_INCLUDE }>;

@Injectable()
export class StoresRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    userId: string,
    input: { promptText: string; promptVersion: string; definition: StoreDefinition },
  ): Promise<StoreRecord> {
    const id = randomUUID();
    const rows = toRows(input.definition, id);
    rows.store.slug = await this.uniqueSlug(userId, rows.store.slug);

    await this.prisma.$transaction(async (tx) => {
      await tx.store.create({
        data: {
          id,
          userId,
          name: rows.store.name,
          slug: rows.store.slug,
          tagline: rows.store.tagline,
          locale: rows.store.locale,
          currency: rows.store.currency,
          status: 'saved',
          promptText: input.promptText,
          promptVersion: input.promptVersion,
          schemaVersion: rows.store.schemaVersion,
          theme: rows.store.theme as unknown as Prisma.InputJsonValue,
          navigation: rows.store.navigation as unknown as Prisma.InputJsonValue,
          header: rows.store.header as unknown as Prisma.InputJsonValue,
          footer: rows.store.footer as unknown as Prisma.InputJsonValue,
          announcementBar:
            (rows.store.announcementBar as unknown as Prisma.InputJsonValue) ?? Prisma.JsonNull,
        },
      });
      await this.insertChildren(tx, rows);
    });

    return this.mustFindRecord(userId, id);
  }

  async listSummaries(
    userId: string,
    limit: number,
    cursor?: string,
  ): Promise<{ items: StoreSummaryRow[]; nextCursor: string | null }> {
    const rows = await this.prisma.store.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      select: { id: true, name: true, slug: true, status: true, updatedAt: true },
    });
    const items = rows.slice(0, limit) as StoreSummaryRow[];
    const nextCursor = rows.length > limit ? (rows[limit]!.id ?? null) : null;
    return { items, nextCursor };
  }

  async findRecord(userId: string, id: string): Promise<StoreRecord | null> {
    const store = await this.prisma.store.findFirst({
      where: { id, userId },
      include: AGGREGATE_INCLUDE,
    });
    return store ? this.toRecord(store) : null;
  }

  async updateMetadata(
    userId: string,
    id: string,
    data: { name?: string; status?: 'draft' | 'saved' },
  ): Promise<StoreRecord | null> {
    const res = await this.prisma.store.updateMany({ where: { id, userId }, data });
    if (res.count === 0) return null;
    return this.findRecord(userId, id);
  }

  /**
   * Replace the store's aggregate from a validated definition, in one
   * transaction. Children are fully replaced (stores are small, ≤ ~200 rows);
   * the mapper already emits minimal diffs — applying them row-by-row is a
   * documented follow-up optimisation.
   */
  async replaceAggregate(
    userId: string,
    id: string,
    definition: StoreDefinition,
  ): Promise<StoreRecord | null> {
    const owned = await this.prisma.store.findFirst({
      where: { id, userId },
      select: { id: true },
    });
    if (!owned) return null;

    const rows = toRows(definition, id);

    await this.prisma.$transaction(async (tx) => {
      await tx.section.deleteMany({ where: { page: { storeId: id } } }); // cascades per-type + items
      await tx.page.deleteMany({ where: { storeId: id } });
      await tx.product.deleteMany({ where: { storeId: id } }); // before categories (RESTRICT)
      await tx.category.deleteMany({ where: { storeId: id } });

      await tx.store.update({
        where: { id },
        data: {
          name: rows.store.name,
          slug: rows.store.slug,
          tagline: rows.store.tagline,
          locale: rows.store.locale,
          currency: rows.store.currency,
          schemaVersion: rows.store.schemaVersion,
          theme: rows.store.theme as unknown as Prisma.InputJsonValue,
          navigation: rows.store.navigation as unknown as Prisma.InputJsonValue,
          header: rows.store.header as unknown as Prisma.InputJsonValue,
          footer: rows.store.footer as unknown as Prisma.InputJsonValue,
          announcementBar:
            (rows.store.announcementBar as unknown as Prisma.InputJsonValue) ?? Prisma.JsonNull,
        },
      });
      await this.insertChildren(tx, rows);
    });

    return this.findRecord(userId, id);
  }

  async delete(userId: string, id: string): Promise<boolean> {
    const res = await this.prisma.store.deleteMany({ where: { id, userId } });
    return res.count > 0;
  }

  // ── internals ────────────────────────────────────────────────────────────
  private async insertChildren(tx: Prisma.TransactionClient, rows: StoreAggregateRows) {
    await tx.category.createMany({ data: rows.categories });
    await tx.product.createMany({ data: rows.products });
    await tx.page.createMany({ data: rows.pages });
    await tx.section.createMany({ data: rows.sections });
    await tx.heroSection.createMany({ data: rows.heroSections });
    await tx.categoriesSection.createMany({ data: rows.categoriesSections });
    await tx.productGridSection.createMany({
      data: rows.productGridSections.map((r) => ({
        ...r,
        cardVariant: (r.cardVariant ?? Prisma.JsonNull) as Prisma.InputJsonValue,
      })),
    });
    await tx.richTextSection.createMany({ data: rows.richTextSections });
    await tx.contactSection.createMany({ data: rows.contactSections });
    await tx.ctaSection.createMany({ data: rows.ctaSections });
    await tx.categoriesSectionItem.createMany({ data: rows.categoriesSectionItems });
    await tx.productGridSectionItem.createMany({ data: rows.productGridSectionItems });
  }

  private async uniqueSlug(userId: string, base: string): Promise<string> {
    const taken = new Set(
      (
        await this.prisma.store.findMany({
          where: { userId, OR: [{ slug: base }, { slug: { startsWith: `${base}-` } }] },
          select: { slug: true },
        })
      ).map((s) => s.slug),
    );
    if (!taken.has(base)) return base;
    for (let i = 2; i < 1000; i += 1) if (!taken.has(`${base}-${i}`)) return `${base}-${i}`;
    return `${base}-${randomUUID().slice(0, 8)}`;
  }

  private async mustFindRecord(userId: string, id: string): Promise<StoreRecord> {
    const record = await this.findRecord(userId, id);
    if (!record) throw new Error('store vanished immediately after creation');
    return record;
  }

  private toRecord(store: LoadedStore): StoreRecord {
    const sections = store.pages.flatMap((p) => p.sections);
    const aggregate: StoreAggregateRows = {
      categories: store.categories.map((c) => ({
        id: c.id,
        storeId: c.storeId,
        name: c.name,
        slug: c.slug,
        description: c.description,
        accentColor: c.accentColor,
        position: c.position,
      })),
      products: store.products.map((p) => ({
        id: p.id,
        storeId: p.storeId,
        categoryId: p.categoryId,
        name: p.name,
        slug: p.slug,
        description: p.description,
        priceMinor: p.priceMinor,
        currency: p.currency,
        imageKind: p.imageKind,
        imageRef: p.imageRef,
        imageStyle: p.imageStyle,
        featured: p.featured,
        badge: p.badge,
        position: p.position,
      })),
      store: {
        id: store.id,
        name: store.name,
        slug: store.slug,
        tagline: store.tagline,
        locale: store.locale,
        currency: store.currency,
        status: store.status,
        promptText: store.promptText,
        promptVersion: store.promptVersion,
        schemaVersion: store.schemaVersion,
        theme: store.theme as never,
        navigation: store.navigation as never,
        header: store.header as never,
        footer: store.footer as never,
        announcementBar: (store.announcementBar as never) ?? null,
      },
      pages: store.pages.map((p) => ({
        id: p.id,
        storeId: p.storeId,
        slug: p.slug,
        title: p.title,
        position: p.position,
      })),
      sections: sections.map((s) => ({
        id: s.id,
        pageId: s.pageId,
        type: s.type as never,
        position: s.position,
        background: s.background,
        container: s.container,
        paddingY: s.paddingY,
        align: s.align,
      })),
      heroSections: sections.flatMap((s) =>
        s.hero ? [{ ...s.hero, ctaTargetType: s.hero.ctaTargetType as never }] : [],
      ),
      categoriesSections: sections.flatMap((s) => (s.categories ? [omitItems(s.categories)] : [])),
      productGridSections: sections.flatMap((s) =>
        s.productGrid ? [omitItems(s.productGrid)] : [],
      ),
      richTextSections: sections.flatMap((s) => (s.richText ? [s.richText] : [])),
      contactSections: sections.flatMap((s) => (s.contact ? [s.contact] : [])),
      ctaSections: sections.flatMap((s) =>
        s.cta ? [{ ...s.cta, buttonTargetType: s.cta.buttonTargetType as never }] : [],
      ),
      categoriesSectionItems: sections.flatMap((s) => s.categories?.items ?? []),
      productGridSectionItems: sections.flatMap((s) => s.productGrid?.items ?? []),
    };

    return {
      id: store.id,
      name: store.name,
      slug: store.slug,
      status: store.status,
      promptVersion: store.promptVersion,
      schemaVersion: store.schemaVersion,
      definition: toDefinition(aggregate),
      createdAt: store.createdAt,
      updatedAt: store.updatedAt,
    };
  }
}

function omitItems<T extends { items?: unknown }>(row: T): Omit<T, 'items'> {
  const { items: _items, ...rest } = row;
  return rest;
}
