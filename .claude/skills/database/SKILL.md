---
name: database
description: Rules for the PostgreSQL data model and Prisma usage in Xandevo — the normalized schema (per-type section tables + FK references), the Store Definition <-> rows mapper, conventions, indexes, constraints, migrations. Load for schema or query work.
---

# Xandevo — Database Rules

Full detail: `docs/database/data-model.md` and ADR-006. Checklist:

## Model (ADR-006 — normalized; JSON only for presentation tokens)

- **Section content and every cross-entity reference are relational.** Class-table style:
  `sections` base (`type`, `position`) + one `<type>_sections` content table per section
  type (1:1, `sectionId` PK/FK, cascade). Category/product references go in ordered join
  tables (`categories_section_items`, `product_grid_section_items`) with FKs.
- Link targets = `*_target_type` enum + `*_target_page_id` / `*_target_section_id` FK /
  `*_target_url`. Never a raw href.
- Core tables: `User`, `Store`, `Page`, `Category`, `Product`.
- **`Store.theme` and `Store.navigation` are `jsonb`** (validated by their Zod sub-schema on
  write) — bounded presentation tokens, no cross-row refs. `meta` (`name`, `tagline`,
  `locale`, `currency`) are typed columns. There is NO JSON blob of the whole definition.
- Don't add new jsonb content columns without a documented reason.

## Store Definition ⇄ rows

- The Store Definition (shared Zod schema) is the contract for generation / rendering /
  editor — NOT the storage format.
- `apps/api/src/stores/domain/store-definition.mapper.ts`: `toRows()` / `toDefinition()`,
  one branch per section type. Round-trip must be identity after normalization (test it).
- Writes: validate → `toRows` → ONE transaction (upsert Store incl. theme/navigation jsonb,
  diff-upsert Page/Section/<type>_sections/Category/Product + join rows, delete removed,
  renumber `position`). Never delete+recreate the whole aggregate; a one-field edit = one
  `UPDATE`.
- Reads: bounded indexed joins → `toDefinition` → return `{ definition, ... }`.

## Conventions

- PK `uuid` (`@default(uuid())`). Base tables: `createdAt @default(now())`,
  `updatedAt @updatedAt`.
- FKs: `onDelete: Cascade` down from `User` (incl. `*_section_items`).
  Exceptions: `Product.categoryId` = `Restrict`; `product_grid_sections.categoryId` and all
  `*_target_*_id` = `SetNull`.
- Enums for closed sets (`Store.status`, `Section.type`, `Product.imageKind`,
  `*_target_type`).
- Money: integer `priceMinor` + `currency` char(3). `CHECK (priceMinor > 0)`. Never floats.
- Explicit int `position` (`>= 0`) on Page, sections, Category, Product, both
  `*_section_items`; normalizer renumbers contiguously on save.

## Indexes & uniqueness

- Unique: `User.googleSub`, `User.email` (citext), `Store(userId, slug)`,
  `Page(storeId, slug)`, `Page(storeId, position)`, `sections(pageId, position)`,
  `Category(storeId, slug)`, each `*_section_items(sectionId, position)`.
- Index: `Store(userId)`, `Store(userId, updatedAt DESC)`, every FK,
  `Product(storeId, categoryId)`.

## Access rules

- Prisma used ONLY in `repositories/*.repository.ts`. Services depend on repositories.
- Every aggregate read is `userId`-scoped (via the owning `Store`). A test must prove
  cross-user access returns 404.
- No raw SQL with interpolated user input.

## Migrations

- One migration per logical change; meaningful name; reviewed. Never edit an applied one.
- Prod migrations run by CI / privileged role, not the app runtime user.
- **New section type = new `<type>_sections` table + enum value + migration + mapper branch
  + repository.** Follow `docs/architecture/store-definition.md` §5.
- Store Definition `schemaVersion` bumps use migration functions in `packages/shared`; a DB
  migration is only needed when columns/enums change.
