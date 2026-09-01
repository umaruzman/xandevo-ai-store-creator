# Store Definition Architecture

The **Store Definition** is the central contract of Xandevo. It is the single structured
document that the AI produces, validation guards, persistence stores, the renderer draws,
and the editor mutates.

```
User Prompt → AI Generation Service → Structured Store Definition → Schema Validation
→ Business Validation → Sanitization → Normalization → Store Definition
→ Store Renderer → Live Preview → Editor (mutates) → Save
```

## 1. Non-negotiables

- The AI returns **data only**, conforming to this schema. No component code, no HTML, no
  CSS strings, no URLs to arbitrary scripts.
- The schema is defined **once** as a Zod schema in `packages/shared` and TS types are
  inferred from it. Both apps import it.
- Every field has a max length / range. Unknown fields are stripped. Unknown section types
  are rejected at generation and ignored (fail-safe) at render.
- The schema is **versioned** (`schemaVersion`). Migrations are pure functions
  `vN -> vN+1` kept in `packages/shared`.

## 2. Conceptual shape (v1 target)

All style variation comes from a **bounded set of named enums and tokens** — never raw CSS,
fonts, or numbers from the model. The renderer holds one predefined recipe per enum value.

```
StoreDefinition
  schemaVersion: number
  meta: { name, tagline?, locale, currency }        // e.g. locale "en-AE", currency "AED"

  theme:
    preset: 'minimal'|'luxury'|'playful'|'brutalist'|'warm-organic'|'tech'   // coarse identity; sets defaults
    colors: { primary, secondary, background, surface, text, muted, accent, border }  // hex tokens
    typography:
      fontPairing: <named pair id>                  // NOT arbitrary font names
      baseSizePx: 14..18, scaleRatio: 1.125..1.333
      headingWeight: 'regular'|'medium'|'semibold'|'bold'
      headingCase: 'none'|'upper'
      letterSpacing: 'tight'|'normal'|'wide'
      bodyLineHeight: 'tight'|'normal'|'relaxed'
    style:
      radius: 'none'|'sm'|'md'|'lg'|'full'
      borderWidth: 'none'|'hairline'|'thin'
      buttonShape: 'rounded'|'pill'|'square'
      spacing: 'compact'|'normal'|'roomy'
      shadow: 'none'|'soft'|'strong'
      motion: 'none'|'subtle'|'expressive'
      containerWidth: 'narrow'|'standard'|'wide'
      pageBackground: 'solid'|'subtle-gradient'|'pattern'
      sectionDividers: 'none'|'line'|'shape'
    components:                                       // reusable variant defaults, referenced by sections
      productCard: { variant: 'standard'|'minimal'|'overlay'|'horizontal',
                     imageRatio: 'square'|'portrait'|'landscape',
                     radius: 'inherit'|'none'|'sm'|'md'|'lg',
                     frame: 'none'|'border'|'shadow',
                     hover: 'none'|'lift'|'zoom'|'image-swap',
                     pricePlacement: 'under-title'|'beside-title'|'on-image',
                     showBadges: boolean, cta: 'button'|'link'|'icon' }
      button:       { variant: 'solid'|'outline'|'ghost', size: 'sm'|'md'|'lg' }
      categoryCard: { variant: 'image-tile'|'text-chip'|'icon-row' }

  navigation: { links: [{ label, target }] }
  header:  { variant: 'minimal'|'centered-logo'|'with-search', sticky: boolean, transparentOverHero: boolean }
  footer:  { columns: [{ title, links: [{ label, target }] }], social?: [{ platform, handle }],
             showPaymentIcons: boolean, showNewsletter: boolean }
  announcementBar?: { text, link?: target, tone: 'primary'|'accent'|'dark', dismissible: boolean }

  pages: Page[]                                      // always includes 'home', 'about', 'contact'
  categories: Category[]
  products: Product[]

Page
  id, slug ('home'|'about'|'contact'|string), title
  sections: Section[]                                // ordered

Section  (discriminated union on `type`)
  id, type, order
  layout:                                            // shared by every section type
    background: 'surface'|'muted'|'primary'|'accent'|'gradient'
    container:  'full'|'boxed'|'narrow'
    paddingY:   'sm'|'md'|'lg'
    align:      'left'|'center'
  + type-specific settings:
    'hero'       -> { headline, subheadline?, description, cta: { label, target },
                      heroLayout: 'centered'|'split-left'|'split-right'|'fullbleed-overlay'|'minimal',
                      height: 'compact'|'standard'|'tall'|'viewport', overlayStrength: 0..3 }
    'categories' -> { title?, categoryIds: string[], categoriesLayout: 'grid'|'scroller'|'list', columns: 2..4 }
    'productGrid' -> { title?, categoryId?, productIds?: string[], limit?,
                       productGridLayout: 'grid'|'carousel', columns: 2..4, cardVariant?: <productCard override>,
                       showViewAll: boolean }
    'richText'   -> { title?, body, width: 'narrow'|'prose'|'wide' }   // plain text / constrained markdown subset
    'contact'    -> { title?, description?, email?, phone?, address?, showForm: boolean,
                      contactLayout: 'form-left'|'form-right'|'stacked' }
    'cta'        -> { headline, description?, button: { label, target },
                      ctaLayout: 'banner'|'boxed'|'split', emphasis: 'subtle'|'bold' }

// The per-type layout enum is named `<type>Layout` so it never collides with the
// shared section `layout` object. `id` and `order` are absent from AI output —
// normalization assigns them; the input form references entities by slug
// (`categorySlugs`, `categorySlug`, `productSlugs`, `cta.target: {type:'page', slug}`)
// and normalization resolves those to `categoryIds` / `productIds` / `pageId`.

Category
  id, name, slug, description?, accentColor?         // token override, optional & rare

Product
  id, name, description, priceMinor: integer, currency, categoryId,
  image: { kind: 'placeholder', seed: string, style?: 'photo'|'illustration'|'pattern'|'mono' }
       | { kind: 'url', url: string }               // url host allowlisted (later)
  featured?: boolean                                 // renderer gives a larger card / ribbon
  badge?: 'new'|'limited'|'bestseller'
```

**Implementation (Phase 3):** the schema lives in `@xandevo/shared/store-definition` as
two Zod schemas — `storeDefinitionInputSchema` (AI output; slug refs, no ids) and
`storeDefinitionSchema` (normalized; id refs). The pure pipeline
`buildStoreDefinition(raw)` in `@xandevo/shared/domain` runs
parse → schema → `assertBusinessRules` → `sanitizeStoreDefinitionInput` →
`normalizeStoreDefinition`, throwing `StoreDefinitionError` (stage + issues) on failure.

- **Coherence:** the model picks a `preset`, then overrides only a few tokens. The prompt
  gives each preset a personality so combinations stay sensible (`luxury` ≠ `radius: full` +
  `motion: expressive`).
- **Prices** are integer minor units (`priceMinor`) + `currency`, never floats.
  `0 < priceMinor <= 100_000_00`.
- **Images** in MVP are `kind: 'placeholder'` with a deterministic `seed` (+ optional `style`
  hint); the renderer maps it to a generated SVG / allowlisted placeholder service.
- **Targets** (`cta.target`, `button.target`, nav/footer links, `announcementBar.link`) are
  structured: `{ type: 'page', slug }` | `{ type: 'section', id }` | `{ type: 'external', url }`
  (url allowlisted) | `{ type: 'none' }`. No raw hrefs from the AI.
- **Variation budget:** ~2–5 options per axis. It is multiplicative — 6 presets × 5 hero
  layouts × 4 card variants × 3 grid columns ≈ 360 looks before colors/fonts. Do not inflate
  option counts.

## 3. Validation layers

| Layer | Enforces |
|---|---|
| Schema (Zod) | shape, types, **every style value is a known enum**, string lengths, clamped numbers (`columns` 2–4, `overlayStrength` 0–3, `baseSizePx` 14–18, …), discriminated unions, `fontPairing` ∈ named set |
| Business validation | 1–8 categories, 3–40 products, each category has ≥1 product, pages contain required slugs, section `order` unique per page, price bounds, currency matches `meta.currency`, `cardVariant`/`categoryId`/target refs resolve |
| Sanitization | strip HTML tags & control chars, collapse whitespace, cap lengths, drop disallowed markdown, reject `javascript:`/`data:` in any url field except approved image data-URIs |
| Normalization | assign missing ids (uuid), resolve slug refs → ids, renumber `order` 0..n, dedupe slugs, **apply `preset` defaults then overlay explicit token overrides**, fill `layout`/`components` defaults, ensure home/about/contact pages exist |

Output of all four layers = a **trusted** Store Definition.

## 4. Renderer mapping

`SECTION_REGISTRY: Record<SectionType, React.ComponentType<SectionProps>>`. The renderer
walks `page.sections` sorted by `order` and renders `SECTION_REGISTRY[section.type]`.
Theme is applied by setting CSS custom properties from `theme` on the renderer root.
Products/categories are resolved by id from the top-level arrays.

## 5. Extensibility — adding a new section type

1. Add the variant to the `Section` discriminated union in `packages/shared` (new `type` +
   settings schema). Bump `schemaVersion` if the change isn't purely additive-optional.
2. Add the `type` to the `Section.type` enum and create a `<type>_sections` table (+ any
   `*_section_items` join table) — Prisma migration.
3. Add a branch to `store-definition.mapper.ts` (`toRows` + `toDefinition`) and a repository
   for the new table.
4. Add business rules to the validator if needed.
5. Add a component to `SECTION_REGISTRY` in `apps/web`.
6. Add editor controls (a case in the editor's section-field map).
7. Add the type to the AI prompt's allowed-sections list + an example.
8. Add a schema version-migration function if `schemaVersion` changed.

Adding a theme capability follows the same pattern on `theme` (schema → validator →
renderer CSS variables → editor control → prompt).

## 6. Why a Store Definition (vs generating code)

- **Safety:** no arbitrary code path from model output to execution.
- **Editability:** structured fields map directly to editor controls and to diff/version
  history later.
- **Persistence:** decomposed into normalized rows on save and reassembled on read by
  `store-definition.mapper.ts` (ADR-006). The definition is the contract, not the storage
  format; round-trip is identity after normalization.
- **Portability:** the same definition can drive preview now and server-rendered published
  storefronts later.
- **Testability:** deterministic `definition -> DOM`.

Tradeoff: less visual freedom than free-form generation. Accepted — the section registry and
theme tokens are the extension mechanism.

## 7. Persistence mapping (ADR-006)

| Store Definition | Rows |
|---|---|
| `meta` (`name`, `tagline`, `locale`, `currency`) | typed columns on `Store` |
| `theme` (preset + colors + typography + style + `components`), `navigation`, `header`, `footer`, `announcementBar` | validated `jsonb` columns on `Store` (bounded token sets, no cross-row refs) |
| `schemaVersion`, `promptVersion` | columns on `Store` |
| `pages[]` | `Page` rows (`slug`, `title`, `position`) |
| `pages[].sections[]` | `sections` base row (`type`, `position`, shared `layout` columns: `background`, `container`, `padding_y`, `align`) + one `<type>_sections` content row (typed columns incl. that type's layout enums) |
| section `cta.target` / nav targets | `*_target_type` enum + `*_target_page_id` / `*_target_section_id` FK / `*_target_url` |
| `categories` section's `categoryIds` | `categories_section_items` join rows (FK + `position`) |
| `productGrid` explicit `productIds` | `product_grid_section_items` join rows (FK + `position`) |
| `categories[]` | `Category` rows (typed columns) |
| `products[]` | `Product` rows (typed columns; `categoryId` FK, `RESTRICT`) |

**Content and every cross-entity reference are relational** — a section cannot reference a
category/product/page that doesn't exist. Only store-level presentation tokens stay JSON.
Writes are one transaction with a minimal diff (upsert changed, delete removed, renumber
`position`); reads are bounded indexed joins. Handled by
`apps/api/src/stores/domain/store-definition.mapper.ts`; see `docs/database/data-model.md`
§5 and §8.

Adding a new section type therefore also means: **a `<type>_sections` table + migration + a
mapper branch + a repository** (in addition to the schema/renderer/editor/prompt steps in §5).
