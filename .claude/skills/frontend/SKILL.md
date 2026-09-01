---
name: frontend
description: Rules for apps/web (Next.js 15 App Router, TypeScript, Tailwind, shadcn/ui) — Server vs Client Components, state, forms, the Store Renderer, and the editor. Load for any task under apps/web.
---

# Xandevo — Frontend Rules

Full detail: `docs/architecture/frontend-architecture.md`. This is the checklist.

## Components

- **Server Component by default.** Add `"use client"` only for state/effects/browser APIs/
  event handlers. Push the client boundary to the smallest leaf.
- Pages stay RSC; fetch initial data server-side and pass as props.
- Client islands: prompt form, generation status, Store Renderer, editor panel, save bar,
  session/query providers.

## State (ADR-007)

- Persisted data → **TanStack Query** hooks (`useStores`, `useStore`, `useCreateStore`,
  `useUpdateStore`). Invalidate on mutation. **(Introduced in Phase 9 — not yet present.)**
- Working store definition → the single **Zustand** builder store (`lib/store/builder.ts`,
  built in Phase 6). It is the only editable copy. Hydrate it from a Query result; never edit
  inside the Query cache.
- `selectIsDirty` is a derived selector (FNV-1a hash of a key-sorted stringify vs
  `savedHash`), not stored.
- Until Phase 9, generation runs through a **Server Action** (`useActionState`) that calls
  the server-only `apiFetch`; its result is pushed into the builder store in a `useEffect`.
- `updateField(path, value)` validates against the relevant Zod sub-schema before applying;
  replaces `definition` immutably.
- Local UI state → `useState` / `react-hook-form`.
- Renderer subscribes with fine-grained selectors; memoize section components.

## Types & API

- Import Store Definition / API types from `packages/shared`. Never redefine.
- All API calls go through `lib/api-client.ts` (injects `Authorization`, parses the error
  envelope). Types from shared.
- Server Actions may proxy simple posts to the API but the API stays authoritative.

## Forms

- `react-hook-form` + `zodResolver`, schemas from `packages/shared`. Client validation is UX
  only; the API re-validates.

## Store Renderer  (`components/renderer/*`, Phase 7)

- Pure `<StoreRenderer definition pageSlug? registry? />`. `SECTION_REGISTRY` +
  `<SectionSlot>`: unknown `type` → skip + dev `console.warn`, never throw. Renders
  `AnnouncementBar? + SiteHeader + <main> sections + SiteFooter`.
- Theme: `resolveThemeVars(theme)` (already fully normalized) → `--sf-*` CSS custom
  properties on `[data-sf-root]`. Section components style only via those vars + Tailwind.
- **Style variation is enum-keyed.** `recipes.ts`: every style value resolves through
  `pick(map, key, fallback)` → fixed class string; unknown key → documented default.
  Never accept classes or raw CSS from the definition.
- Catalogue/`href` lookups via `RendererProvider` context, memoized on
  `[theme, categories, products]` (NOT the whole `definition`) so `React.memo`'d sections
  isolate: a single-section content edit re-renders only that section.
- **No `dangerouslySetInnerHTML`.** `richText.body` → split on blank lines into `<p>`.
  Images: `placeholderImage(seed, name)` inline SVG data URI + `<img alt>` (no `next/image`
  until real uploads). Semantic landmarks; storefront `<StorePreview>` is builder chrome.

## Editor

- Edits structured data only — never the DOM. Field components: value + `onChange` →
  `updateField`.
- MVP editable: hero text/CTA, theme colors, category names, product name/desc/price,
  About/Contact text, section order.
- Optimistic local updates; Save persists via mutation; on failure keep local state + retry.
- Warn on low text/background contrast.

## Tailwind / shadcn

- Utility-first for builder chrome; shared preset from `packages/config`.
- shadcn primitives in `components/ui`, wrapped not forked.
- Storefront theme is **data via CSS variables**, not Tailwind config.

## Performance

- Minimize `"use client"`. Memoize renderer sections. Tune Query `staleTime`. `next/font`,
  `next/image`, route-level code splitting.
