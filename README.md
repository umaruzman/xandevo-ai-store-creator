# Xandevo — AI Store Builder

**by Umar Uzman**

> **Status: Phase 1 (Architecture & Planning) complete. Implementation has not started.**
> This repository currently contains architecture documentation, engineering standards, and
> Claude Code workflow assets only. No application code exists yet.

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

> Not yet available. Established in **Phase 2 — Repository & Development Foundation**, whose
> top priority is a frictionless setup (hosting is deferred — see `docs/decisions/OPEN-QUESTIONS.md` Q4).
> Target developer experience:
>
> ```
> cp .env.example .env        # fill in Google + Anthropic keys
> pnpm install
> pnpm db:up                  # docker compose: Postgres
> pnpm db:migrate             # prisma migrate
> pnpm dev                    # turborepo: apps/web + apps/api together
> ```
>
> One command set, no global installs beyond Node + pnpm + Docker.

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

Phase 1 complete; all open decisions resolved (`docs/decisions/OPEN-QUESTIONS.md`, 2026-09-01).
Awaiting approval to begin Phase 2.

## Future roadmap

12 phases from repository foundation to release — `docs/development/roadmap.md`.
