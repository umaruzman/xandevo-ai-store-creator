# ADR-003 — Store Definition Architecture

- **Status:** Accepted (Phase 1)
- **Date:** 2026-08-31

## Context

The AI must turn a prompt into a renderable, editable, persistable storefront. It could
generate React/HTML/CSS source, or a structured data document. Generated code is a security
and maintainability hazard (arbitrary execution, unpredictable editing, hard to diff/persist).

## Decision

Introduce a single **Store Definition**: a versioned, schema-constrained JSON document that
is the contract between AI, validation, persistence, renderer, and editor.

- Defined once as a **Zod schema** in `packages/shared`; TS types inferred from it.
- `schemaVersion` field; forward migrations are pure functions in `packages/shared`.
- Sections are a **discriminated union** on `type`; the renderer maps `type` →
  `SECTION_REGISTRY[type]` component.
- Theme is **tokens** (validated hex colors, named font pairings, enum style values) applied
  as CSS custom properties — never arbitrary CSS.
- **Visual variation is bounded and named.** A `theme.preset` gives a coarse identity
  (`minimal`, `luxury`, `playful`, …) that sets defaults; `theme.components` holds reusable
  variant defaults (product card, button, category card); every section carries shared
  `layout` enums plus a few type-specific layout enums. Each enum value has exactly one
  predefined renderer recipe. ~2–5 options per axis; the space is multiplicative. See
  `docs/architecture/store-definition.md` §2.
- AI output passes: Zod schema → business validation → sanitization → normalization before
  it is trusted.

Full shape and extension process: `docs/architecture/store-definition.md`.

## Rationale

- No code path from model output to execution.
- Structured fields map 1:1 to editor controls and future version-history diffs.
- One well-defined document that maps cleanly to normalized rows on save and back on read
  (ADR-006); the schema is the contract regardless of storage layout.
- Same definition can drive live preview now and server-rendered published storefronts later.
- Extensible via the section registry + theme tokens without touching the pipeline.

## Consequences

- Less visual freedom than free-form generation; new layouts require a new section type
  (schema + validator + component + editor control + prompt example + migration).
- The schema is a coordination point — changes ripple to both apps (acceptable in a monorepo).

## Alternatives rejected

- **AI generates React/HTML:** unsafe, unpredictable, un-editable structurally.
- **Headless CMS as the model:** heavyweight; still needs a generation-target schema.
