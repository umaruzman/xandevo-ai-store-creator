# ADR-006 — Database Architecture

- **Status:** Accepted (Phase 1; resolved 2026-09-01, revised 2026-09-01)
- **Date:** 2026-08-31 / revised 2026-09-01

## Context

The storefront can be stored as one JSON document on `Store`, or normalized into relational
tables. Umar chose normalization, then refined the boundary: **section content and all
cross-entity references belong in proper relational tables** (referential integrity is the
driver — a section that points at a deleted category must be impossible, not merely
policed by app code); **store-level presentation tokens (theme colors, typography, border
radius, spacing/shadow, navigation, meta) may stay as validated JSON on `Store`** because
they are a bounded set, edited as a unit, and never referenced by other rows.

## Decision

**Fully normalized relational model, with a narrow JSON boundary for presentation tokens.**

### Tables

Core: `User`, `Store`, `Page`, `Category`, `Product`.

Sections — class-table style (base + one content table per type, 1:1,
`section_id` PK/FK, `ON DELETE CASCADE`):

| Table | Key columns |
|---|---|
| `sections` | `id`, `page_id` FK, `type` (enum), `position`, shared layout enums `background` / `container` / `padding_y` / `align` |
| `hero_sections` | `section_id`, `headline`, `subheadline`, `description`, `cta_label`, `cta_target_type`, `cta_target_page_id` FK, `cta_target_section_id` FK, `cta_target_url` |
| `rich_text_sections` | `section_id`, `title`, `body` (typed `text`, not JSON) |
| `cta_sections` | `section_id`, `headline`, `description`, `button_label`, `button_target_type`, `button_target_page_id` FK, `button_target_section_id` FK, `button_target_url` |
| `contact_sections` | `section_id`, `title`, `description`, `email`, `phone`, `address`, `show_form` |
| `product_grid_sections` | `section_id`, `title`, `category_id` FK (nullable), `limit` |
| `categories_sections` | `section_id`, `title` |

Reference join tables (ordered, FK-cascaded):

| Table | Columns |
|---|---|
| `categories_section_items` | `section_id` FK, `category_id` FK, `position` |
| `product_grid_section_items` | `section_id` FK, `product_id` FK, `position` |

### Rules

- Ownership tree, `ON DELETE CASCADE`: `User → Store → {Page → Section → <type>_sections,
  Category, Product}` and all `*_section_items`.
- `Product.categoryId` FK is `ON DELETE RESTRICT`. Link-target FKs
  (`*_target_page_id`, `*_target_section_id`) are `ON DELETE SET NULL` with a
  `target_type` enum (`page` | `section` | `external` | `none`) — no raw hrefs from the AI.
- `product_grid_sections.category_id` is `ON DELETE SET NULL`.
- Explicit integer `position` on `Page`, `sections`, `Category`, `Product`, and both
  `*_section_items`; normalizer renumbers contiguously on save.
- `Store` keeps `schemaVersion`, `promptVersion`, plus **`theme`** (preset + colors +
  typography + style tokens + `components`), **`navigation`**, **`header`**, **`footer`**,
  and nullable **`announcementBar`** as jsonb columns, each validated by its Zod sub-schema
  before write. `meta` fields (`name`, `tagline`, `locale`, `currency`) are typed columns.
  Per-type section tables carry that type's layout enums; `product_grid_sections.card_variant`
  is a nullable jsonb override. `products` gains `featured` / `badge` / `image_style`;
  `categories` gains `accent_color`.
- The **Store Definition** (Zod schema in `packages/shared`) remains the contract for AI
  generation, validation, rendering, and the editor's working copy. It is **not** the
  storage format. `store-definition.mapper.ts` (`toRows` / `toDefinition`) decomposes a
  validated definition into rows in one transaction and reassembles rows into a definition
  on read. Round-trip is identity after normalization (tested).

Indexes: `User.googleSub` unique, `User.email` unique (citext), `Store(userId, slug)` unique,
`Store(userId)`, `Store(userId, updatedAt DESC)`, `Page(storeId, slug)` unique,
`Page(storeId, position)` unique, `sections(pageId, position)` unique,
`Category(storeId, slug)` unique, `Product(storeId, categoryId)`, every FK indexed,
each `*_section_items(section_id, position)` unique.

## Rationale

- Sections and their references have DB-enforced integrity; a section cannot point at a
  category or page that does not exist.
- Content is queryable and constrainable (checks, enums, NOT NULL) at the DB layer.
- Per-field edits map to per-column updates — good for future field-granular version history.
- Presentation tokens stay JSON because normalizing them buys nothing (no references, no
  cross-store queries, always edited together).

## Consequences

- Larger Phase 3: ~15 tables + enums, a non-trivial `store-definition.mapper`, transactional
  multi-table writes.
- Each **new section type** = a migration + a `<type>_sections` table + a mapper branch + a
  repository. This cost is deliberately on the extension checklist
  (`docs/architecture/store-definition.md` §5).
- Reads assemble an aggregate via bounded, indexed joins; writes diff-upsert (never
  delete+recreate the whole tree).

## Alternatives rejected

- **Single JSON document on `Store`:** no referential integrity for section→category/page
  refs; rejected.
- **One `sections.data` jsonb for all section content (previous revision of this ADR):**
  simpler, fewer tables, but section→entity references stay unenforced; rejected in favour
  of per-type tables + FK join rows.
- **Single wide `sections` table with nullable per-type columns:** weak constraints, wide
  sparse table; rejected.
- **Table-per-type for theme tokens too:** ceremony with no integrity or query benefit.
