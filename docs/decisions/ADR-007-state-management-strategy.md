# ADR-007 — Frontend State Management Strategy

- **Status:** Accepted (Phase 1). Client-state half **implemented in Phase 6**;
  TanStack Query half lands in Phase 9.
- **Date:** 2026-08-31

## Implementation

- **Phase 6 — `lib/store/builder.ts` (Zustand):** the single working copy of the editable
  `definition` plus `storeId`, `promptVersion`, `savedHash`, and `generation { status,
  error }`. Actions: `startGeneration`, `setGenerated`, `setGenerationError`,
  `loadFromServer` / `markSaved` (stubs used from Phase 9), `reset`. `selectIsDirty` is a
  derived selector — `hashValue(definition) !== savedHash` where `hashValue` is FNV-1a over
  a key-sorted `stableStringify` (`lib/hash.ts`). Immutable replacement of `definition`
  keeps undo/redo (`zundo`) addable without refactor.
- **Phase 6 — generation is a Server Action** (`useActionState`), not a TanStack Query
  mutation: it needs the server-only JWT-minting `apiFetch`, and there is no cache to
  invalidate yet. The action result is pushed into the builder store via `useEffect`.
- **Phase 8 — `updateField(path, value)`** on the builder store is the single edit entry
  point: `setAtPath` (structural sharing) → whole-schema `safeParse` of the candidate →
  commit the *candidate* on success (not `parsed.data`), else record `editErrors` and leave
  `definition` unchanged. `moveSection` routes through it. `setGenerated` now stamps
  `savedHash` so a fresh generation is clean and only edits mark it dirty. Undo-readiness is
  asserted by a `zundo` `temporal(builderStateCreator)` spike test; the state creator is
  exported for that.
- **Phase 9 — TanStack Query** (`app/providers.tsx` `QueryClientProvider` in the root
  layout): `lib/queries/stores.ts` hooks (`useStores`, `useStore`, `useCreateStore`,
  `useUpdateStore`) call **BFF route handlers** at `app/api/stores/*` (same-origin, session
  cookie), which proxy to the Nest API via the server-only JWT-minting `apiFetch`. RSC reads
  (`dashboard`, `/stores/[storeId]`) call `apiClient` directly. On save: create → `markSaved`
  + `router.push('/stores/[id]')`; update → `markSaved`; both invalidate `['stores']`. The
  builder store is *hydrated from* a server result (`loadFromServer`), never edited inside
  the query cache.

## Context

The builder has several kinds of state: persisted data (stores list, saved store), the
working store definition being generated/edited, generation status, and dirty/save status.
Mixing these in one container (or scattering the definition across many) causes bugs and
duplicate sources of truth.

## Decision

- **Server state → TanStack Query.** `useStores`, `useStore(id)`, `useCreateStore`,
  `useUpdateStore`. Handles caching, refetch, invalidation. This is the source of truth for
  *persisted* data.
- **Working builder/editor state → a single Zustand store** (`lib/store/builder.ts`):
  `{ storeId, definition, savedHash, generation }` + actions
  (`loadFromServer`, `setGenerated`, `updateField`, `markSaved`, `reset`).
  This is the *only* copy of the editable definition.
- **Derived, not stored:** `isDirty = hash(definition) !== savedHash` via a selector.
- **`updateField(path, value)`** validates the value against the relevant Zod sub-schema
  before applying; updates replace `definition` immutably (undo/redo middleware — e.g.
  `zundo` — can be added without refactor).
- **Local UI state** (open panels, form inputs) → component `useState` / `react-hook-form`.
- The renderer subscribes to the Zustand store with **fine-grained selectors** so a single
  field edit re-renders only the affected section.

## Rationale

- Each state kind uses the tool suited to it; no overlap.
- One working definition ⇒ preview and editor cannot disagree.
- Selector-based subscriptions keep live preview fast.
- Immutable replacement keeps history/versioning cheap to add later.

## Consequences

- Two state libraries (Query + Zustand) — small, well-scoped, widely used.
- Discipline required: never cache the editable definition inside a Query result and edit it
  there; always hydrate the Zustand store from a Query result and edit that.

## Alternatives rejected

- **Redux Toolkit:** more boilerplate than needed.
- **Everything in TanStack Query (incl. draft):** query cache isn't built for
  high-frequency local mutation.
- **React Context + useReducer for the draft:** re-render fan-out hurts live preview.
