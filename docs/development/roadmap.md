# Implementation Roadmap

12 phases. Each phase must pass its **gate** before the next begins. Dependency order is
mostly linear; parallelizable notes are called out.

Global gate items (apply to every phase from Phase 2 on):
`pnpm build`, `pnpm lint`, `pnpm typecheck`, `pnpm test` all green in CI; docs for the area
updated; architectural rules in `CLAUDE.md` + skills followed; Conventional Commits.

---

## Phase 1 — Architecture & Planning  ✅ (this phase)

- **Objective:** establish architecture, standards, docs, and the Claude Code workflow.
- **Scope:** all `docs/`, `CLAUDE.md`, `README.md`, `.claude/skills/`.
- **Dependencies:** none.
- **Outcome:** a foundation future sessions follow consistently.
- **Must NOT:** implement any product code, landing page, auth, AI pipeline, editor,
  preview, API endpoints, DB logic.
- **Docs updated:** all of the above created.
- **Gate:** every Section-29 doc exists with real content; ADRs for genuine decisions;
  skills created; open questions listed; user approves.

## Phase 2 — Repository & Development Foundation

- **Objective:** scaffold the monorepo and tooling, with a **frictionless one-command dev
  setup** as the priority (hosting is deferred — Q4).
- **Scope:** `git init`; pnpm workspaces + Turborepo; `apps/web` (Next.js 15 App Router, TS,
  Tailwind, shadcn init); `apps/api` (Nest scaffold); `packages/shared` + `packages/config`;
  ESLint/Prettier/tsconfig presets; `.env.example` (all vars, placeholder values);
  `docker-compose.yml` for Postgres; root scripts `db:up` / `db:down` / `db:migrate` /
  `dev` / `build` / `lint` / `typecheck` / `test`; CI pipeline; `.nvmrc` + `engines`;
  a `CONTRIBUTING` / README "Local development" walkthrough that works from a clean machine
  (Node + pnpm + Docker only).
- **Dependencies:** Phase 1.
- **Files:** root `package.json`, `pnpm-workspace.yaml`, `turbo.json`, `docker-compose.yml`,
  `.env.example`, `.nvmrc`, app skeletons, empty `packages/shared/src/index.ts`, CI workflow.
- **Outcome:** `cp .env.example .env && pnpm install && pnpm db:up && pnpm dev` brings up
  both apps + Postgres on a fresh clone; CI green on the empty skeleton.
- **Must NOT:** build features, real routes/pages, DB schema, endpoints.
- **Docs:** README "Local development" + "Environment configuration" filled and verified.
- **Gate:** a second person (or clean container) runs the documented commands and both apps
  start with no manual fix-ups; CI passes; both apps typecheck; shadcn/ui installed; no
  feature code.

## Phase 3 — Database & Domain Layer

- **Objective:** normalized data model + the Store Definition schema package + the
  definition⇄rows mapper.
- **Scope:** Prisma schema per ADR-006 — `User`, `Store` (with `theme` / `navigation` jsonb),
  `Page`, `Category`, `Product`, `sections` base + `hero_sections` / `rich_text_sections` /
  `cta_sections` / `contact_sections` / `product_grid_sections` / `categories_sections`,
  and `categories_section_items` / `product_grid_section_items` join tables (~15 tables +
  enums); structured link-target columns (no raw hrefs); first migration;
  per-type section tables carry their layout enums, `sections` base carries the shared
  layout enums, `Store` carries `theme`/`navigation`/`header`/`footer`/`announcementBar`
  jsonb, `products` carry `featured`/`badge`/`image_style`, `categories` carry `accent_color`;
  `PrismaModule`/`PrismaService`; `packages/shared`: Store Definition **Zod schema v1**
  (incl. `theme.preset` + `theme.components` + shared/type-specific section `layout` enums,
  all clamped) + inferred types + section-type enum + `schemaVersion` + version-migration
  scaffold;
  domain validators/normalizers/sanitizer (pure) with unit tests; `store-definition.mapper.ts`
  (`toRows`/`toDefinition`, one branch per section type) with round-trip + minimal-diff tests.
- **Dependencies:** Phase 2.
- **Files:** `apps/api/prisma/schema.prisma`, `.../migrations/*`, `apps/api/src/prisma/*`,
  `apps/api/src/stores/domain/store-definition.mapper.ts`,
  `packages/shared/src/store-definition/*`, `packages/shared/src/api/*` (DTO types).
- **Outcome:** DB migrates; schema + validators + mapper importable/testable; adversarial
  unit tests pass; mapper round-trip is identity after normalization.
- **Must NOT:** controllers, endpoints, AI calls, UI.
- **Docs:** `data-model.md` reconciled with the actual schema; `store-definition.md` updated
  to match v1.
- **Gate:** `prisma migrate` clean on empty DB; every table + enum + index + FK rule from
  `data-model.md` present (per-type section tables, join tables, structured link targets,
  `Product.categoryId` RESTRICT, `theme`/`navigation` jsonb on `Store`); `pnpm test` covers
  validator/normalizer/sanitizer incl. injection/oversize/malformed cases + mapper
  round-trip identity + minimal-diff edit + dangling-reference rejection; no `any` in shared.

## Phase 4 — Authentication

- **Objective:** Google login + API auth.
- **Scope:** Auth.js (Google) in `apps/web`; session → short-lived JWT for API (ADR-005);
  `AuthModule` in `apps/api` (`JwtStrategy`, `JwtAuthGuard`, `@CurrentUser()`);
  `UsersModule` with first-login upsert + `GET /me`; protected `(dashboard)` route group;
  sign-in page; logout.
- **Dependencies:** Phase 3.
- **Files:** `apps/web/app/api/auth/[...nextauth]/route.ts`, `apps/web/app/(auth)/*`,
  `apps/web` middleware, `apps/api/src/auth/*`, `apps/api/src/users/*`.
- **Outcome:** user can sign in with Google, reach a protected placeholder dashboard, sign
  out; API rejects unauthenticated calls; `GET /me` works.
- **Must NOT:** store creation, AI, editor, preview.
- **Docs:** `security.md` auth section reconciled; ADR-005 finalized.
- **Gate:** e2e sign-in/sign-out (mocked Google) passes; `GET /me` integration test; API
  401s without token; JWT `exp/iss/aud` verified.

## Phase 5 — AI Generation Engine

- **Objective:** `POST /generate` end to end (no persistence).
- **Scope:** `AiModule` + `AiProvider` interface + ≥1 real impl (default) + `FakeAiProvider`;
  `PromptBuilder` with versioned templates; `GenerationModule` running the full pipeline;
  retry/timeout/fallback; structured logging + token/cost logging; rate limiting on
  `/generate`.
- **Dependencies:** Phase 3 (schema), Phase 4 (auth).
- **Files:** `apps/api/src/ai/*`, `apps/api/src/generation/*`, `apps/api/prompts/store/v1.*`.
- **Outcome:** authenticated `POST /generate` returns a validated Store Definition; failures
  return `422/503` safely.
- **Must NOT:** save stores, UI beyond a throwaway test client, editor.
- **Docs:** `ai-architecture.md`, `prompt-engineering.md` reconciled; ADR-004 finalized.
- **Gate:** pipeline unit + integration tests with `FakeAiProvider` (valid / malformed /
  injection / oversized fixtures); provider contract test vs recorded fixture; no vendor SDK
  imported outside `src/ai/providers`; no key in logs/responses.

## Phase 6 — Dashboard & Store Creation UX

- **Objective:** the create-store flow UI up to a generated (unsaved) preview handoff.
- **Scope:** dashboard store list (RSC + `GET /stores` — read path may return empty until
  Phase 9, or wire a minimal list endpoint here); `stores/new` prompt form; generation
  status UI; Zustand builder store; loads `/generate` result into the builder store.
- **Dependencies:** Phase 5.
- **Files:** `apps/web/app/(dashboard)/*`, `apps/web/components/builder/*`,
  `apps/web/lib/api-client.ts`, `apps/web/lib/store/builder.ts`, query hooks.
- **Outcome:** user types a prompt, sees progress, lands on a page holding a generated
  definition in state.
- **Must NOT:** renderer, editor, save.
- **Docs:** `frontend-architecture.md` reconciled; ADR-007 finalized.
- **Gate:** component tests for prompt form + status; builder store unit tests (load/reset/
  dirty selector); a11y checks on the form; no client component where a server one suffices.

## Phase 7 — Store Renderer & Live Preview

- **Objective:** schema-driven renderer with instant preview.
- **Scope:** `<StoreRenderer>` + `SECTION_REGISTRY` (Hero, Categories, ProductGrid, RichText,
  Contact, CTA) + Header / Footer / AnnouncementBar; a **variant recipe map per style enum**
  (`theme.preset` defaults, `theme.components.*`, shared + type-specific section `layout`);
  theme via CSS custom properties from `definition.theme`; responsive; device-width toggle;
  safe rendering (no raw HTML); unknown-type and unknown-enum fail-safe (fall back to default).
- **Dependencies:** Phase 6.
- **Files:** `apps/web/components/renderer/*`.
- **Outcome:** the generated definition renders; changing state re-renders without refresh.
- **Must NOT:** editing controls, persistence.
- **Docs:** `store-definition.md` renderer section reconciled.
- **Gate:** renderer tests for each section + one snapshot per style enum value + a matrix
  test over the 6 presets + theme application + unknown-type/unknown-enum fallback;
  reference-definition snapshot; no `dangerouslySetInnerHTML`; memoization verified
  (single-field state change re-renders one section). Full enum cross-product NOT required.

## Phase 8 — Dynamic Editor

- **Objective:** inline editing of structured data.
- **Scope:** `EditorPanel` with TextField / ColorField / section reorder; each edit → validated
  `updateField(path, value)` on the Zustand store; dirty indicator; contrast warnings;
  immutable-replacement updates (undo/redo-ready); no DOM manipulation.
- **Dependencies:** Phase 7.
- **Files:** `apps/web/components/editor/*`, builder-store `updateField`.
- **Outcome:** user edits hero text, colors, category/product fields, About/Contact text,
  section order; preview updates live; dirty state reflects changes.
- **Must NOT:** save/API persistence (Phase 9), version history.
- **Docs:** `frontend-architecture.md` editor section reconciled.
- **Gate:** editor interaction tests; invalid edits rejected + surfaced; dirty selector
  correct; state shape unchanged by edits (only values); zundo can be added without refactor
  (verified by a spike test or documented interface).

## Phase 9 — Persistence & API Integration

- **Objective:** save/load stores.
- **Scope:** `StoresModule` (`POST /stores`, `GET /stores`, `GET /stores/:id`,
  `PATCH /stores/:id`, `DELETE /stores/:id`), `StoreOwnerGuard`, one repository per table
  (all `userId`-scoped), the `store-definition.mapper` wired in, **transactional
  decompose-on-write / assemble-on-read**, server re-validation of the incoming `definition`
  through the full pipeline; web: create/update mutations, cache invalidation, `markSaved`,
  reopen flow hydrating the builder store.
- **Dependencies:** Phase 8 (mapper itself built in Phase 3).
- **Files:** `apps/api/src/stores/*` (controller, service, `repositories/*`, guards),
  web query/mutation hooks, `[storeId]` page load.
- **Outcome:** full loop — generate → edit → save → reload → keep editing; edits produce
  minimal row diffs, not full aggregate rewrites.
- **Must NOT:** publish/public storefronts, version history, regenerate endpoint,
  per-entity (`/products/:id`) endpoints.
- **Docs:** `api-contract.md` reconciled with implementation; `backend-architecture.md`
  + `data-model.md` persistence sections reconciled.
- **Gate:** API integration tests (CRUD + ownership 404 + validation 422) against real
  Postgres; write is a single transaction (rollback on partial failure — tested); reload
  returns a definition equal to what was saved; body-size + rate limits enforced; every
  query `userId`-scoped (test proves cross-user access fails); `Product.categoryId` RESTRICT
  behaviour tested.

## Phase 10 — UI/UX, Security & Performance

- **Objective:** production-readiness pass.
- **Scope:** landing page; polish dashboard/builder UX; loading/error boundaries everywhere;
  CSP + Helmet + CORS lockdown; rate-limit tuning; payload limits; audit logging;
  performance pass (RSC/client audit, memoization, query `staleTime`, indexes verified,
  `next/image`); a11y audit (keyboard, landmarks, contrast).
- **Dependencies:** Phase 9.
- **Outcome:** app is secure, accessible, and performs well for MVP scale.
- **Must NOT:** introduce queues/Redis/CDN infra (that's future scaling).
- **Docs:** `security.md`, `scaling.md` (MVP section) reconciled; add a security checklist to
  PR template.
- **Gate:** security checklist passes; Lighthouse/a11y thresholds met on key routes; no
  N+1 queries in list/detail; CSP active with no violations on core flows.

## Phase 11 — Testing & Quality Assurance

- **Objective:** close coverage gaps and lock quality.
- **Scope:** fill backend unit/integration gaps; frontend component/interaction tests for
  renderer + editor; Playwright e2e covering auth, create, generate (FakeAiProvider),
  preview, edit, save, reload; coverage thresholds in CI; flaky-test triage.
- **Dependencies:** Phase 10.
- **Outcome:** confidence to release; regressions caught by CI.
- **Docs:** `.claude/skills/testing/SKILL.md` reconciled with actual setup; testing section
  in README.
- **Gate:** coverage thresholds met; full e2e suite green in CI; no skipped/only tests;
  test run time acceptable.

## Phase 12 — Documentation & Release

- **Objective:** finalize docs and ship.
- **Scope:** reconcile all `docs/` with the shipped system; ops runbook (env, migrations,
  key rotation, deploy, rollback); finalize ADR statuses; README "current status" → shipped;
  CHANGELOG; tag `v0.1.0`.
- **Dependencies:** Phase 11.
- **Outcome:** MVP released; docs match reality.
- **Gate:** every doc reviewed against code; runbook validated by a dry-run deploy; ADRs
  marked Accepted/Superseded; version tagged.

---

## Phase gate summary table

| Phase | Headline gate |
|---|---|
| 1 | Docs + skills + ADRs exist with real content; user approval |
| 2 | Clone→install→dev works; CI green on skeleton |
| 3 | Full normalized schema (~15 tables, per-type section tables, FK refs) migrates clean; Store Definition v1 + validators tested vs adversarial input; mapper round-trip identity + minimal-diff |
| 4 | Google sign-in e2e; API 401s without token; `/me` works |
| 5 | `/generate` pipeline tested with Fake + fixtures; no SDK leakage; no key exposure |
| 6 | Prompt→generation→builder-store flow; component + store tests; RSC/client discipline |
| 7 | Every section renders; theme via CSS vars; no raw HTML; memoization verified |
| 8 | Structured editing; invalid edits rejected; undo-ready state shape |
| 9 | CRUD + ownership + validation integration tests on real PG; transactional write; reload == saved; e2e save/reload |
| 10 | Security checklist + a11y + perf thresholds; CSP active |
| 11 | Coverage thresholds; full e2e green; no skipped tests |
| 12 | Docs match code; runbook dry-run; ADRs finalized; tagged |
