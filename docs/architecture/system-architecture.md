# System Architecture

## 1. Purpose & scope

Xandevo converts a natural-language prompt into a validated, structured storefront that is
rendered live, edited inline, and persisted per user. This document describes the whole
system; area documents go deeper.

## 2. Architectural principles

- **Separation of concerns** — UI, application logic, domain rules, and infrastructure are
  distinct layers with one-directional dependencies.
- **Single responsibility** — every module/class/component has one reason to change.
- **Dependency inversion where it pays** — application code depends on interfaces for AI
  providers and data access, not concrete vendors/ORM calls. Not applied dogmatically.
- **Explicit module boundaries** — NestJS modules and frontend feature folders expose a
  narrow public surface; internals stay private.
- **Strong typing end to end** — TypeScript `strict`; shared shapes in `packages/shared`.
- **Validation at boundaries** — HTTP (DTOs), AI output (Zod), env (schema-checked config).
- **Schema-driven AI output** — AI returns data matching the Store Definition schema; never
  code, markup, or component source.
- **Reusable, presentational UI** — the Store Renderer is a pure function of Store Definition
  and is reused for preview and (future) published storefronts.
- **Predictable data flow** — server state via TanStack Query; working store state in one
  Zustand store; no hidden cross-container duplication.
- **Testability** — pure domain functions, injectable dependencies, mockable providers.
- **Minimal duplication, practical MVP** — no abstraction without a second concrete use case
  or a clear near-term one.

## 3. High-level component view

```
┌─────────────────────────────── apps/web (Next.js 15) ───────────────────────────────┐
│  (marketing)  (auth)  (dashboard: create / preview / edit)                          │
│  Server Components (fetch, layout)   Client Components (builder, editor, renderer)   │
│  Auth.js (Google) → session cookie + JWT for API calls                              │
└───────────────┬────────────────────────────────────────────────────────────────────┘
                │ HTTPS + Bearer JWT
┌───────────────▼────────────────────────── apps/api (NestJS) ────────────────────────┐
│  AuthModule   UsersModule   StoresModule   GenerationModule                         │
│  AiModule (global): AiProvider ── OpenAIProvider | AnthropicProvider | GeminiProvider│
│  Controllers (thin) → Services (application/domain) → Repositories (Prisma)         │
│  Pipes: ValidationPipe (class-validator)   Guards: JwtAuthGuard, StoreOwnerGuard    │
└───────────────┬───────────────────────────────────┬────────────────────────────────┘
                │                                   │
        ┌───────▼────────┐                 ┌────────▼─────────┐
        │  PostgreSQL    │                 │  AI provider API │  (server-side only)
        │  (Prisma)      │                 └──────────────────┘
        └────────────────┘
```

`packages/shared` is imported by both apps: Store Definition Zod schema + inferred types,
API request/response types, shared enums (section types, etc.).

## 4. Request flows

**Generate (not persisted):**
web form → `POST /generate` (JWT) → GenerationService builds versioned prompts →
`AiProvider.generateStructured` → JSON parse → Zod validate → business validate → sanitize →
normalize → returns `StoreDefinition` → web loads it into the Zustand builder store → renderer.

**Save:** builder store `definition` → `POST /stores` (create) or `PATCH /stores/:id` (update)
→ DTO validation → `StoreOwnerGuard` → StoresService validates + `mapper.toRows` →
transactional upsert of the normalized aggregate → returns `Store` →
web invalidates TanStack Query cache, clears dirty flag.

**Reopen:** `GET /stores/:id` (JWT + owner) → `Store` with `definition` → web hydrates builder
store → renderer + editor.

## 5. Layering (pragmatic clean architecture)

| Layer | Web | API |
|---|---|---|
| Presentation | Route handlers, RSC, components | Controllers, DTOs |
| Application | Server actions, query/mutation hooks, Zustand store | Services (use cases) |
| Domain | Store Definition schema & pure helpers (`packages/shared`) | Domain functions, validators, Store Definition schema |
| Infrastructure | `fetch` client, Auth.js | Prisma repositories, `AiProvider` impls, config |

**Dependency direction:** Presentation → Application → Domain ← Infrastructure. Domain
(the Store Definition + validation rules) depends on nothing. Infrastructure implements
interfaces the application owns (`AiProvider`, repository interfaces). We do **not** create
separate entity/DTO/mapper classes for every model in the MVP — Prisma types + Zod-inferred
types are the domain types until a concrete need justifies more.

## 6. Cross-cutting concerns

- **Config:** typed, schema-validated env loader in each app; fail fast on boot.
- **Errors:** API returns a consistent error envelope (see api-contract). Web shows
  route-level `error.tsx` boundaries and toast for mutations.
- **Logging:** structured JSON logs in the API (request id, userId, route, latency). AI
  calls log provider, prompt version, token usage, outcome — never full prompt/PII at info level.
- **Observability (later):** OpenTelemetry traces, `/health` + `/ready` endpoints.

## 7. Key decisions

Recorded as ADRs in `docs/decisions/`: monorepo (ADR-001), frontend/backend separation
(ADR-002), Store Definition (ADR-003), AI provider abstraction (ADR-004), auth strategy
(ADR-005), database architecture (ADR-006), state management (ADR-007).

## 8. Explicit non-goals for MVP

Multi-tenant billing, published public storefronts with custom domains, real payments,
media upload pipeline, collaborative editing, i18n of the builder UI, background job queue.
All are considered in `docs/architecture/scaling.md` but not built now.
