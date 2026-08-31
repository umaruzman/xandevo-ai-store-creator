# ADR-007 — Frontend State Management Strategy

- **Status:** Accepted (Phase 1)
- **Date:** 2026-08-31

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
