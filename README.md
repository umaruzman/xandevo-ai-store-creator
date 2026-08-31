# Xandevo — AI Store Builder

**by Umar Uzman**

> **Status: Phase 2 (Repository & Development Foundation) complete.**
> The monorepo, tooling, CI, and app skeletons exist and boot. No product features yet —
> `apps/web` serves a placeholder page and `apps/api` exposes only `/health` and `/ready`.
> Feature work begins in Phase 3 (database & domain layer).

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
cp .env.example .env     # fill in ANTHROPIC_API_KEY; Google keys come in Phase 4
pnpm install
pnpm db:up               # docker compose: Postgres 16 on :5432
pnpm dev                 # turborepo: web (:3000) + api (:4000) together
```

- `pnpm dev` — run both apps
- `pnpm build` / `pnpm lint` / `pnpm typecheck` / `pnpm test` — run across the workspace via Turborepo
- `pnpm db:up` / `pnpm db:down` / `pnpm db:logs` — local Postgres
- `pnpm format` — Prettier

`pnpm db:migrate` (Prisma) arrives in Phase 3. API health check: `curl localhost:4000/health`.

## Environment configuration

> Defined in Phase 2. Planned variables (server-only in `apps/api`):
> `DATABASE_URL`, `AI_PROVIDER` (default `anthropic`), `ANTHROPIC_API_KEY` (plus
> `OPENAI_API_KEY` / `GEMINI_API_KEY` when those providers are used), `AUTH_JWT_SECRET`.
> Web: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `AUTH_SECRET`, `AUTH_JWT_SECRET`,
> `NEXT_PUBLIC_API_URL`.
> AI keys never appear in `apps/web` or any `NEXT_PUBLIC_` variable.

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

Phase 2 complete: pnpm + Turborepo monorepo, `apps/web` (Next.js 15 / React 19 / Tailwind v4
/ shadcn wired), `apps/api` (NestJS 11 + HealthModule), `packages/shared` + `packages/config`,
ESLint/Prettier/tsconfig presets, Docker Compose Postgres, GitHub Actions CI. `pnpm dev` boots
both apps. All Phase-1 decisions resolved (`docs/decisions/OPEN-QUESTIONS.md`).
Next: **Phase 3 — Database & Domain Layer**.

## Future roadmap

12 phases from repository foundation to release — `docs/development/roadmap.md`.
