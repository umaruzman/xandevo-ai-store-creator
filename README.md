# Xandevo — AI Store Builder

**by Umar Uzman**

> **Status: Phase 4 (Authentication) complete.**
> Monorepo + CI (Phase 2); **Store Definition Zod schema v1** + pipeline + normalized
> **Prisma schema** (15 tables) + mapper (Phase 3); **Google sign-in** via Auth.js with a
> short-lived JWT the API verifies, first-login user provisioning, `GET /me`, and a guarded
> `(dashboard)` route group (Phase 4). Store generation/editing not built yet.
> Next: **Phase 5 — AI Generation Engine**.

## Overview

Xandevo turns a natural-language description of a store into a live, editable, persistent
storefront. A user writes something like *"Create a luxury perfume store for UAE customers"*;
an AI generation engine produces a **structured Store Definition** (theme, hero, categories,
products, About/Contact pages, ordered sections); Xandevo validates it, renders it live,
lets the user edit key fields, and saves it to their account.

## Features (planned)

- Natural-language store generation
- Structured, schema-validated Store Definition (no AI-generated code)
- Provider-agnostic AI engine (OpenAI / Anthropic / Gemini behind one interface)
- Schema-driven live preview that updates without refresh
- Inline editing of titles, colors, and descriptions
- Google authentication
- Persistent, per-user stores you can reopen and keep editing

## Architecture

- **Monorepo** (pnpm workspaces + Turborepo): `apps/web`, `apps/api`, `packages/shared`, `packages/config`.
- **Frontend:** Next.js 15 App Router, TypeScript, TailwindCSS, shadcn/ui. Server Components
  by default; Zustand for builder/editor state; TanStack Query for server state.
- **Backend:** NestJS modular architecture with DI, PostgreSQL + Prisma. Thin controllers,
  service/domain layer, repository data access, DTO validation.
- **AI:** internal `AiProvider` abstraction; structured generation validated against Zod
  schemas; AI output treated as untrusted input.
- **Store Definition:** the central contract between AI, persistence, renderer, and editor.

Full detail: [`docs/architecture/system-architecture.md`](docs/architecture/system-architecture.md).

## Technology stack

| Layer | Choice |
|---|---|
| Monorepo | pnpm workspaces, Turborepo |
| Web | Next.js 15, React, TypeScript, TailwindCSS, shadcn/ui, TanStack Query, Zustand |
| API | NestJS, TypeScript, Prisma, PostgreSQL |
| Shared | Zod, TypeScript |
| AI | OpenAI / Anthropic / Gemini via `AiProvider` interface |
| Auth | Google OAuth (Auth.js in web, JWT session) + short-lived JWT verified by API |
| AI default | Anthropic (`AI_PROVIDER=anthropic`), no fallback in MVP |
| Testing | Jest + Supertest (API), Vitest + Testing Library (web), Playwright (e2e) |

## Repository structure

```
apps/
  web/     Next.js 15 builder UI
  api/     NestJS API, AI generation, persistence
packages/
  shared/  Zod schemas + TS types (Store Definition, API DTOs)
  config/  Shared eslint / tsconfig / prettier / tailwind presets
docs/
  architecture/  system, frontend, backend, ai, scaling, security, store-definition
  decisions/     ADRs + open questions
  api/           API contract
  database/      conceptual data model + ER diagram
  ai/            prompt engineering
  development/   workflow, roadmap
.claude/
  skills/  area-specific rules for Claude Code
```

## Local development

Prerequisites: Node 22 (`.nvmrc`), pnpm 10, Docker. Nothing else global.

```bash
cp apps/api/.env.example apps/api/.env    # set ANTHROPIC_API_KEY (used from Phase 5)
cp apps/web/.env.example apps/web/.env    # set AUTH_GOOGLE_ID / AUTH_GOOGLE_SECRET + a real
                                         # AUTH_SECRET (`npx auth secret`); keep AUTH_JWT_SECRET
                                         # identical in both .env files
pnpm install
pnpm db:up                                # docker compose: Postgres 16 on host port 5433
pnpm db:migrate                           # apply Prisma migrations
pnpm dev                                  # turborepo: web (:3000) + api (:4000)
```

- `pnpm dev` / `pnpm build` / `pnpm lint` / `pnpm typecheck` / `pnpm test` — workspace-wide via Turborepo
- `pnpm db:up` / `pnpm db:down` / `pnpm db:logs` — local Postgres (host port 5433 to avoid clashing with a local 5432)
- `pnpm db:migrate` — `prisma migrate dev` in `apps/api`
- `pnpm format` — Prettier

API check: `curl localhost:4000/health` (liveness) and `curl localhost:4000/ready` (DB reachable).
Env is per-app (`apps/api/.env` for server/DB/AI, `apps/web/.env` for browser/auth).

## Environment configuration

Per-app, documented in each `.env.example`.

- **`apps/api/.env`** (server-only): `DATABASE_URL`, `AI_PROVIDER` (default `anthropic`),
  `ANTHROPIC_API_KEY` (+ `OPENAI_API_KEY` / `GEMINI_API_KEY` if switched), `AUTH_JWT_SECRET`,
  `API_PORT`.
- **`apps/web/.env`**: `NEXT_PUBLIC_API_URL`, `AUTH_SECRET`, `AUTH_URL`, `AUTH_GOOGLE_ID`,
  `AUTH_GOOGLE_SECRET`, `AUTH_JWT_SECRET`.
- `AUTH_JWT_SECRET` (≥16 chars) must be **identical** in both files — it signs/verifies the
  API JWT. AI keys never appear in `apps/web` or any `NEXT_PUBLIC_` variable.
- Google OAuth client: authorized redirect URI `http://localhost:3000/api/auth/callback/google`.

## Database

PostgreSQL via Prisma, **normalized**. Section content and all cross-entity references are
relational (`sections` base + one `<type>_sections` table per section type + FK join
tables; core `User, Store, Page, Category, Product`); only `Store.theme` and
`Store.navigation` are validated JSON. Conceptual model + ER diagram:
`docs/database/data-model.md` (ADR-006). Schema authored in Phase 3. The Store Definition is
the generation/render/editor contract, mapped to/from rows on save/load — not a stored JSON blob.

## AI integration

See `docs/architecture/ai-architecture.md` and `docs/ai/prompt-engineering.md`. All AI calls
happen server-side in `apps/api`. Output is parsed, schema-validated, business-validated,
sanitized, and normalized before it becomes a Store Definition.

## Testing

See `.claude/skills/testing/SKILL.md`. Unit + integration + e2e; AI providers and Google
OAuth are mocked; PostgreSQL is real in integration tests.

## Documentation

Everything under `docs/`. Start with `docs/architecture/system-architecture.md` and the ADRs
in `docs/decisions/`.

## AI-assisted development workflow

Claude Code is the primary engineering assistant. `CLAUDE.md` is the concise source of truth;
`.claude/skills/` holds area-specific rules; `docs/` holds detail. See
`docs/development/development-workflow.md`.

## Current project status

Phases 1–4 complete. Foundation (monorepo, CI), the Store Definition schema + pipeline +
Prisma model + mapper, and Google authentication (Auth.js → short-lived API JWT →
`JwtStrategy` → first-login provisioning → `GET /me`, guarded `(dashboard)` group) are in
place. API endpoints: `/health`, `/ready`, `/me`. Decisions log:
`docs/decisions/OPEN-QUESTIONS.md`. Next: **Phase 5 — AI Generation Engine**.

## Future roadmap

12 phases from repository foundation to release — `docs/development/roadmap.md`.
