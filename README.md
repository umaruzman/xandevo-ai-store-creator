# Xandevo — AI Store Builder

**by Umar Uzman**

> **Status: Phase 10 (UI/UX, Security & Performance) complete.**
> The full loop works: sign in → generate → edit in the split editor ‖ preview → **Save**.
> Stores persist to Postgres (normalized aggregate, transactional write, server-side
> re-validation), list on the dashboard, and reopen at `/stores/[id]` to keep editing.
> API: `/health`, `/ready`, `/me`, `POST /generate`, full `/stores` CRUD.
> Hardened: nonce CSP + security headers on web, Helmet + audit logging + tuned rate limits
> on the API, real landing page, loading/error boundaries, a11y landmarks, RSC/perf pass.
> Editor is a full-bleed customizer with **inline text editing** in the live preview; a
> desert-luxe landing + sign-in; generation runs on prompt `store@v2` with a self-repair
> retry, Anthropic prompt caching, and an optional `ai_interactions` audit table.
> Next: **Phase 11 — Testing & Quality Assurance**.

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

## Setup & run

Full walkthrough: **[`docs/development/setup.md`](docs/development/setup.md)**. The short version:

```bash
pnpm install
cp apps/api/.env.example apps/api/.env    # set ANTHROPIC_API_KEY + AUTH_JWT_SECRET
cp apps/web/.env.example apps/web/.env    # set AUTH_SECRET, AUTH_GOOGLE_ID/SECRET,
                                         # and the SAME AUTH_JWT_SECRET
pnpm db:up && pnpm db:migrate             # PostgreSQL 16 in Docker (host port 5433)
pnpm dev                                  # web :3000, api :4000
```

Then open http://localhost:3000. Generation runs on **Anthropic Claude** — currently the only
provider implemented; get a key at [console.anthropic.com](https://console.anthropic.com).
Google sign-in needs an OAuth client (redirect URI
`http://localhost:3000/api/auth/callback/google`) — see the setup guide.

Every key is documented in each `.env.example`. `AUTH_JWT_SECRET` (≥16 chars) must be
**identical** in both files — it signs/verifies the API JWT (ADR-005). AI keys never appear in
`apps/web` or any `NEXT_PUBLIC_*` variable.

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

Phases 1–10 complete — the MVP loop is end to end: generate → edit → save → reload, with a
production-readiness pass on top (nonce CSP + security headers, API Helmet + audit logging +
tuned rate limits + 256 KB body cap, loading/error/not-found boundaries, a11y landmarks,
RSC/memoization/perf audit). Since then: a full-bleed store customizer with inline text
editing in the preview, a committed visual world for the public pages (landing + sign-in),
prompt `store@v2` + schema-repair retry + Anthropic prompt caching, and an opt-in
`ai_interactions` log table. API: `/health`, `/ready`, `/me`, `POST /generate`, full
`/stores` CRUD (normalized transactional persistence). Generation runs on Anthropic Claude
(the only provider implemented). Decisions log: `docs/decisions/OPEN-QUESTIONS.md`.
Next: **Phase 11 — Testing & Quality Assurance**.

## Future roadmap

12 phases from repository foundation to release — `docs/development/roadmap.md`.
