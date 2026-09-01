# Frontend Architecture (`apps/web`)

Next.js 15, App Router, React, **TypeScript only**, TailwindCSS, shadcn/ui.

> **Built so far:** root layout + `(auth)/sign-in` + `(dashboard)` group (Phase 4);
> `(dashboard)/dashboard` (RSC, `apiClient.me()`, empty stores list) and
> `(dashboard)/stores/new` (Phase 6) — RSC page → `<CreateStoreFlow>` (client):
> `PromptForm` → Server Action `generateStoreAction` → `apiClient.generateStore` →
> `useBuilderStore.setGenerated` → `<GeneratedSummary>`. Single route, two states, no
> navigation/persistence. Zustand builder store per ADR-007; TanStack Query deferred to
> Phase 9. `middleware.ts` gates `/dashboard/*` and `/stores/*`.

## 1. Guiding rules

- **Server Components by default.** Add `"use client"` only when the component needs state,
  effects, browser APIs, or event handlers that can't be server-driven.
- **Push client boundaries down.** A page stays an RSC; only the interactive leaf (editor
  panel, renderer preview, a form) is a Client Component.
- **One working-store source of truth.** The editable Store Definition lives in a single
  Zustand store, not scattered across component state.
- **Server state ≠ client state.** Persisted data (stores list, saved store) is fetched/cached
  with TanStack Query. Ephemeral builder data (current definition, dirty flag, generation
  status) is Zustand.
- **Types from `packages/shared`.** Never redefine Store Definition or API shapes locally.

## 2. Route structure

```
app/
  layout.tsx                     Root layout: fonts, providers, <body>
  (marketing)/
    page.tsx                     Landing (RSC)                        [Phase 6+]
  (auth)/
    sign-in/page.tsx             Google sign-in                        [Phase 4]
  (dashboard)/
    layout.tsx                   Auth-guarded shell, nav (RSC + client nav bits)
    dashboard/page.tsx           Store list (RSC, server fetch)        [Phase 6]
    stores/
      new/page.tsx               Prompt form → generation              [Phase 6]
      [storeId]/
        page.tsx                 Loads store (RSC) → <BuilderClient>   [Phase 7/8]
        loading.tsx              Skeleton
        error.tsx                Error boundary
  api/
    auth/[...nextauth]/route.ts  Auth.js handler                       [Phase 4]
```

Route groups: `(marketing)`, `(auth)`, `(dashboard)` isolate layouts and auth requirements.

## 3. Layouts, loading, errors

- Root `layout.tsx`: HTML shell, font setup, `<Providers>` (Query client, session, theme).
- `(dashboard)/layout.tsx`: server-side session check → redirect to sign-in if absent;
  renders nav.
- Every dynamic route with data has `loading.tsx` (skeleton) and `error.tsx` (recoverable
  boundary with retry).
- Streaming: wrap slow server data in `<Suspense>` with a meaningful fallback.

## 4. Server vs Client — concrete allocation

| Concern | Type |
|---|---|
| Landing, marketing content | Server |
| Dashboard store list fetch + layout | Server |
| Store fetch on `[storeId]` page | Server (passes data as prop) |
| Prompt form | Client (controlled input, submit state) |
| Generation status / progress | Client (Zustand) |
| Store Renderer (preview) | Client (subscribes to Zustand, instant updates) |
| Editor panel (title/color/text fields) | Client |
| Save button / dirty indicator | Client |
| Auth session provider | Client wrapper over server session |

The Store Renderer is deliberately client-side so preview updates on every keystroke without
a network round trip. Its component logic is pure (`definition -> JSX`) so the same tree can
be server-rendered later for published storefronts.

## 5. Data communication

- **Reads:** RSC calls the API directly with `fetch` (server-side, JWT from session) for
  initial load. Client refetch/refresh via TanStack Query hooks (`useStores`, `useStore`).
- **Writes:** TanStack Query mutations (`useCreateStore`, `useUpdateStore`) hitting a typed
  `apiClient`. On success: invalidate relevant queries, clear Zustand dirty flag, toast.
- **Typed client:** `lib/api-client.ts` wraps `fetch`, injects `Authorization`, parses the
  standard error envelope, returns types from `packages/shared`.
- Server Actions are allowed for simple form posts (e.g. create-from-prompt) but the API
  remains the system of record; actions just proxy to it.

## 6. Builder & editor state (Zustand)

```ts
interface BuilderState {
  storeId: string | null;
  definition: StoreDefinition | null;   // the one working copy
  savedHash: string | null;             // to derive isDirty
  generation: { status: 'idle'|'pending'|'success'|'error'; error?: string };
  // actions
  loadFromServer(store: Store): void;
  setGenerated(def: StoreDefinition): void;
  updateField(path: FieldPath, value: unknown): void;   // validated patch
  markSaved(store: Store): void;
  reset(): void;
}
```

- `isDirty` = `hash(definition) !== savedHash` (selector, not stored state).
- `updateField` runs the field through the relevant Zod sub-schema before applying; invalid
  edits are rejected and surfaced inline.
- History (undo/redo) and version history are future features; keep updates as immutable
  replacements of `definition` so a middleware (e.g. `zundo`) can be added without refactor.

## 7. Forms & validation

- `react-hook-form` + `@hookform/resolvers/zod`, schemas from `packages/shared`.
- Client validation is UX only; the API re-validates authoritatively.
- Prompt form: length limits, non-empty, trim; disables submit while `generation.status`
  is `pending`.

## 8. UI component architecture

```
components/
  ui/            shadcn/ui primitives (generated, minimally customized)
  layout/        Nav, Shell, PageHeader
  builder/       PromptForm, GenerationStatus, SaveBar
  editor/        EditorPanel, TextField, ColorField, SectionList
  renderer/      StoreRenderer + Header/Footer/AnnouncementBar + section components
                 + recipes/ (one class-recipe map per style enum)
```

- **shadcn/ui strategy:** install primitives as needed into `components/ui`; wrap, don't fork,
  for app-specific behavior. Keep them agnostic to the storefront theme.
- **Tailwind strategy:** utility-first; shared design tokens (builder chrome) in the Tailwind
  preset from `packages/config`. The **storefront theme is data**, applied via CSS custom
  properties set from `definition.theme` on the renderer root — not Tailwind config.
- **Theme system:** renderer resolves `theme.preset` → default tokens, overlays explicit
  `theme.colors`/`typography`/`style` overrides, then sets `--color-*`, `--font-*`,
  `--radius`, `--space-*`, etc. Section components consume the variables.
- **Variant recipes:** every style enum (`theme.components.productCard.variant`, section
  `layout.background`, `hero.heroLayout`, `productGrid.columns`, …) maps through a small
  `recipes/` lookup to a fixed set of Tailwind classes / CSS-var values. The model's output
  only ever selects a key; it never supplies classes or raw CSS. Unknown key → documented
  default. ~2–5 keys per axis (see `docs/architecture/store-definition.md` §2).

## 9. Store preview architecture

- `<StoreRenderer definition={def} />` — maps `definition.pages[].sections[]` to a registry
  of section components (`SECTION_REGISTRY[type]`).
- Unknown section type → render nothing + dev warning (fail safe, never throw in preview).
- Renders inside a scrollable, responsive container; a device-width toggle (mobile/desktop)
  is a wrapper, not per-component logic.
- No `dangerouslySetInnerHTML`. All text rendered as text. Images use `next/image` with an
  allowlisted placeholder host / data-URI strategy (see store-definition doc).

## 10. Editor architecture

- Editor edits **structured data**, never the DOM. Each field component receives a value +
  an `onChange` that calls `updateField(path, value)`.
- MVP editable: hero headline/description/CTA text, theme colors, category names, product
  name/description/price, About/Contact text, section order (drag within page).
- Optimistic UI: edits apply to Zustand immediately; Save persists. On save failure, keep
  local state, show retry (no rollback needed since nothing was optimistically sent to peers).

## 11. Responsive & accessibility

- Mobile-first Tailwind breakpoints for builder chrome.
- Renderer sections are responsive by construction (grid/flex, `clamp()` type scale).
- A11y: shadcn/Radix primitives for focus management; semantic landmarks in renderer
  (`header`, `main`, `section`, `footer`); color fields warn on low contrast against theme
  background; all interactive controls keyboard reachable; `next/image` requires `alt`.

## 12. Performance

- Keep most of the tree RSC; ship minimal JS.
- Renderer: `React.memo` section components keyed by stable ids; derive nothing expensive in
  render; selector-based Zustand subscriptions to avoid whole-tree re-render on one field edit.
- `next/font` for fonts; `next/image` for images; route-level code splitting is automatic.
- TanStack Query `staleTime` tuned so navigating back to the dashboard doesn't refetch
  needlessly.
