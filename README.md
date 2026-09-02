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

**Prerequisites** (nothing else global): **Node 22** (`nvm use` reads `.nvmrc`),
**pnpm 10** (`corepack enable`), **Docker** (for Postgres). A first `pnpm build` also needs
network once to fetch the web fonts via `next/font`.

### 1. Install

```bash
pnpm install
```

### 2. Environment files

Both apps read their own `.env` (git-ignored). Copy the examples:

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

Then edit them:

**`apps/api/.env`**
- `DATABASE_URL` — leave as-is; it matches `docker-compose.yml` (Postgres on host port **5433**).
- `AI_PROVIDER` — set **`fake`** to run the whole generate flow with **no API key** (returns a
  themed fixture), or keep `anthropic` and set `ANTHROPIC_API_KEY` for real generation.
- `AUTH_JWT_SECRET` — any string ≥16 chars. **Must be identical to the one in `apps/web/.env`.**
- `AI_LOG_INTERACTIONS` — set `true` to record every prompt/response to the `ai_interactions`
  table (see *Inspecting AI calls* below). Off by default.

**`apps/web/.env`**
- `AUTH_SECRET` — generate one: `npx auth secret` (or any 32+ char random string).
- `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` — a Google OAuth **Web application** client from
  [console.cloud.google.com](https://console.cloud.google.com) → *APIs & Services → Credentials*.
  Authorized redirect URI: `http://localhost:3000/api/auth/callback/google`. Sign-in is the only
  step that can't be faked — the rest of the app runs without it.
- `AUTH_JWT_SECRET` — **the same value** as in `apps/api/.env`.
- `NEXT_PUBLIC_API_URL` — leave as `http://localhost:4000`.

### 3. Database

```bash
pnpm db:up          # start Postgres 16 in Docker (host port 5433)
pnpm db:migrate     # apply Prisma migrations + generate the client
```

### 4. Start

```bash
pnpm dev            # Turborepo runs both apps: web on :3000, api on :4000
```

Open **http://localhost:3000**. Check the API with `curl localhost:4000/health` (liveness) and
`curl localhost:4000/ready` (DB reachable).

### Everyday commands

| Command | What it does |
|---|---|
| `pnpm dev` | web (`:3000`) + api (`:4000`) with hot reload |
| `pnpm build` / `pnpm lint` / `pnpm typecheck` / `pnpm test` | workspace-wide via Turborepo |
| `pnpm --filter @xandevo/api test:e2e` | API end-to-end (needs `pnpm db:up`) |
| `pnpm db:up` / `pnpm db:down` / `pnpm db:logs` | local Postgres lifecycle |
| `pnpm db:migrate` | `prisma migrate dev` in `apps/api` |
| `pnpm --filter @xandevo/api db:studio` | Prisma Studio — browse the database |
| `pnpm format` | Prettier |

### Inspecting AI calls

With `AI_LOG_INTERACTIONS=true` in `apps/api/.env`, one row per provider call (each retry
included) is written to `ai_interactions` with the exact system + user prompt, the raw tool
output, parse errors, token counts (incl. cache), and cost. Browse it with
`pnpm --filter @xandevo/api db:studio` (model **AiInteraction**) or any Postgres client on
`postgresql://xandevo:xandevo@localhost:5433/xandevo`. The API also prints a one-line
`{"event":"generation",…}` summary per request to stdout regardless.

### Troubleshooting

- **Port 5433 already in use** — another Postgres is on `5432`; this project deliberately maps
  `5433:5432`. Stop the other one or change the host port in `docker-compose.yml` **and**
  `DATABASE_URL`.
- **`pnpm build` fails fetching fonts** — the first web build downloads Google fonts via
  `next/font`; run it once with network, after that it's cached.
- **Sign-in redirect error** — the Google client's redirect URI must be exactly
  `http://localhost:3000/api/auth/callback/google`, and `AUTH_URL` must be `http://localhost:3000`.
- **API 401 on every call** — `AUTH_JWT_SECRET` differs between the two `.env` files.

## Environment configuration (reference)

Per-app, fully documented in each `.env.example`.

| File | Keys |
|---|---|
| `apps/api/.env` (server-only) | `NODE_ENV`, `API_PORT`, `DATABASE_URL`, `AI_PROVIDER`, `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL`, `AI_LOG_INTERACTIONS`, `OPENAI_API_KEY`/`GEMINI_API_KEY` (unused), `AUTH_JWT_SECRET` |
| `apps/web/.env` | `NEXT_PUBLIC_API_URL`, `AUTH_SECRET`, `AUTH_URL`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `AUTH_JWT_SECRET` |

`AUTH_JWT_SECRET` (≥16 chars) must be **identical** in both files — it signs/verifies the API
JWT (ADR-005). AI keys never appear in `apps/web` or any `NEXT_PUBLIC_*` variable.

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
`/stores` CRUD (normalized transactional persistence). Set `AI_PROVIDER=fake` in
`apps/api/.env` to generate without an Anthropic key. Decisions log:
`docs/decisions/OPEN-QUESTIONS.md`.
Next: **Phase 11 — Testing & Quality Assurance**.

## Future roadmap

12 phases from repository foundation to release — `docs/development/roadmap.md`.
