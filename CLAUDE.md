# CLAUDE.md — Xandevo

Concise project-level source of truth for Claude Code. Detailed knowledge lives in `docs/`.

## What Xandevo is

Xandevo — **AI Store Builder by Umar Uzman**. A user describes a store in natural language
("Create a luxury perfume store for UAE customers"); an AI engine turns it into a validated,
structured **Store Definition**; Xandevo renders it live, lets the user edit key properties,
and persists it for later.

Core flow: Landing → Auth (Google) → Dashboard → Create Store → Prompt → AI Generation →
Store Definition → Schema Validation → Live Preview → Dynamic Editing → Save → Persistent Store.

## Current phase

**Phase 6 — Dashboard & Store Creation UX. COMPLETE.** Next: **Phase 7 — Store Renderer &
Live Preview** (`<StoreRenderer>` + `SECTION_REGISTRY`, theme via CSS vars, variant recipes,
instant re-render from the builder store; no editor/save).

What exists now:
- **Web builder (Phase 6):** `lib/store/builder.ts` (Zustand — the one working `definition`,
  `generation` status, `selectIsDirty` via `lib/hash.ts`); `(dashboard)/stores/new` RSC →
  `<CreateStoreFlow>` (client) → `PromptForm` → **Server Action `generateStoreAction`** →
  `lib/api-client.ts#generateStore` (over server-only `apiFetch`) → `setGenerated` →
  `<GeneratedSummary>`. `middleware.ts` gates `/dashboard/*` + `/stores/*`. TanStack Query
  is Phase 9 (no persisted reads yet).
- **AI generation (Phase 5):** `AiModule` (`AiProvider` interface + `AI_PROVIDER` token,
  factory on `AI_PROVIDER` env); providers under `src/ai/providers/` only —
  `AnthropicProvider` (default, `emit_store_definition` tool) + `FakeAiProvider`
  (`AI_PROVIDER=fake`). `GenerationModule`: versioned prompt TS module
  `generation/prompts/store/v1.ts`, `PromptBuilder`, `GenerationService` (retry ×3 +
  backoff, 60 s timeout, runs `buildStoreDefinition`, JSON logs + cost estimate). **`POST
  /generate`** (auth, `@HttpCode(200)`, 10/min/user) → `{ definition, promptVersion, usage }`.
  Global `ValidationPipe`, `AllExceptionsFilter` (standard `{ error: {...} }` envelope),
  `RequestIdMiddleware`, per-user `ThrottlerGuard`.
- **Auth (Phase 4):** `@xandevo/shared/auth` (API JWT contract); `apps/web` Auth.js
  (NextAuth v5) Google + `mintApiToken` + `apiFetch` + `middleware.ts` gating `/dashboard`;
  `apps/api` global `JwtAuthGuard` (`@Public()` opts out) + `JwtStrategy` + `UsersModule`
  (`upsertFromClaims`, `GET /me`). `(auth)/sign-in` + `(dashboard)` route groups.
- **`packages/shared`** — Store Definition **Zod schema v1** (`store-definition/*`: input +
  normalized forms, enums, `CURRENT_SCHEMA_VERSION`, `migrateToLatest` scaffold), the pure
  pipeline `buildStoreDefinition()` (`domain/*`: schema → `assertBusinessRules` →
  `sanitizeStoreDefinitionInput` → `normalizeStoreDefinition`, throwing `StoreDefinitionError`),
  API DTO types (`api/*`), test fixtures (`testing/*`, also at `@xandevo/shared/testing`).
- **`apps/api`** — `prisma/schema.prisma` (15 tables per ADR-006) + first migration;
  `PrismaModule`/`PrismaService`; `ConfigModule`; `HealthModule`; `AuthModule` + `UsersModule`
  (Phase 4); `AiModule` + `GenerationModule` (Phase 5);
  `src/stores/domain/store-definition.mapper.ts` (`toRows`/`toDefinition`, pure, round-trip
  tested). Endpoints: `/health`, `/ready`, `/me`, `POST /generate`. No store repositories /
  persistence wiring yet.
- Monorepo, CI, Docker Compose Postgres (host port **5433**) from Phase 2.
- Per-app env: `apps/api/.env`, `apps/web/.env` (copy from each `.env.example`).
  `AI_PROVIDER=fake` runs generation with no API key (dev/CI).

Still prohibited until their phase: store **renderer** / live preview (Phase 7), dynamic
**editor** (Phase 8), store repositories / persistence endpoints + **save** + TanStack Query
(`POST/GET/PATCH /stores`, Phase 9). A real landing page is Phase 10 (the current
`app/page.tsx` is a placeholder). See `docs/development/roadmap.md`.

## Technology stack

- **Monorepo:** pnpm workspaces + Turborepo.
- **Frontend (`apps/web`):** Next.js 15 App Router, React, **TypeScript only** (no JS),
  TailwindCSS, shadcn/ui. Server Components by default; Client Components only where
  interaction requires it. TanStack Query for server state, Zustand for builder/editor state.
- **Backend (`apps/api`):** NestJS, TypeScript, modular + DI, PostgreSQL, Prisma ORM.
  Thin controllers → services (application/domain) → repositories (Prisma). DTOs validated
  with `class-validator`.
- **Shared (`packages/shared`):** Zod schemas + TS types for the Store Definition and API
  contracts. Single source of truth for cross-app types.
- **AI:** internal `AiProvider` interface. Implementations for OpenAI / Anthropic / Gemini,
  selected by config; **default `anthropic`**, no fallback in MVP. No provider SDK is
  imported outside `apps/api/src/ai`. API keys are server-only and never reach the browser.
- **Database:** normalized (ADR-006). Section content + all cross-entity references are
  relational — `sections` base + one `<type>_sections` table per section type + FK join
  tables; core `User, Store, Page, Category, Product`. Only `Store` presentation blobs
  (`theme` incl. `preset` + `components`, `navigation`, `header`, `footer`, `announcementBar`)
  are validated `jsonb`; sections carry their layout as typed enum columns. The Store Definition is the
  generation/render/editor contract, mapped to/from rows by `store-definition.mapper`; it is
  not stored as a JSON blob.
- **Auth:** Auth.js Google OAuth in `apps/web` (JWT session), short-lived JWT verified by
  `apps/api` (ADR-005).

## Non-negotiable rules

1. **TypeScript everywhere.** `strict` on. No `any` without a written justification comment.
2. **Validate at every boundary.** HTTP input → DTO + `class-validator`. AI output → Zod
   schema + business validation + sanitization. Treat AI output as untrusted external input.
3. **AI never produces code.** It produces data conforming to the Store Definition schema.
   The renderer maps data → components. No `dangerouslySetInnerHTML` on generated content,
   no `eval`, no dynamic component code.
4. **Provider abstraction.** Application code depends on `AiProvider`, never on a vendor SDK.
5. **Thin controllers.** Business logic lives in services / pure domain functions, never in
   controllers or React components.
6. **Store isolation.** Every store query is scoped by the authenticated `userId`. No
   endpoint returns another user's data.
7. **One source of truth for working store state** — the Zustand builder store. Do not
   duplicate the editable definition across containers.
8. **Shared types are shared.** Cross-app shapes live in `packages/shared`, imported by both
   apps. Do not redefine them locally.
9. **Small atomic commits.** Conventional Commits. No giant mixed commits. See
   `docs/development/development-workflow.md`.
10. **Update docs with the code.** A phase is done only when its docs are updated and its
    gate passes.

## Repository map

```
apps/web        Next.js 15 storefront builder UI
apps/api        NestJS API + AI generation + persistence
packages/shared Zod schemas & TS types (Store Definition, API DTOs)
packages/config eslint / tsconfig / prettier / tailwind presets
docs/           architecture, decisions (ADRs), api, database, ai, development
.claude/skills/ area-specific rules for Claude Code
```

## Where to look

| Need | File |
|---|---|
| System overview | `docs/architecture/system-architecture.md` |
| Frontend rules | `docs/architecture/frontend-architecture.md`, `.claude/skills/frontend/SKILL.md` |
| Backend rules | `docs/architecture/backend-architecture.md`, `.claude/skills/backend/SKILL.md` |
| Store Definition | `docs/architecture/store-definition.md`, `.claude/skills/ai-generation/SKILL.md` |
| AI pipeline | `docs/architecture/ai-architecture.md`, `docs/ai/prompt-engineering.md` |
| Data model | `docs/database/data-model.md`, `.claude/skills/database/SKILL.md` |
| API contract | `docs/api/api-contract.md` |
| Security | `docs/architecture/security.md` |
| Scaling | `docs/architecture/scaling.md` |
| Testing | `.claude/skills/testing/SKILL.md` |
| Decisions & rationale | `docs/decisions/` |
| Phases & gates | `docs/development/roadmap.md` |
| Git / workflow | `docs/development/development-workflow.md` |

## Decisions

All Phase 1 open questions are resolved (`docs/decisions/OPEN-QUESTIONS.md`, 2026-09-01):
Auth.js + JWT (A); normalized DB with per-type section tables + FK references, JSON only for
`Store.theme`/`navigation` (B, refined 2026-09-01); Anthropic default; hosting deferred
(prioritise one-command local dev); section set as proposed; placeholder images.
ADR-001..007 all Accepted.
