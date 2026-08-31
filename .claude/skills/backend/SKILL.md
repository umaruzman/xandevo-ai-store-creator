---
name: backend
description: Rules for apps/api (NestJS, TypeScript, Prisma, PostgreSQL) — module structure, thin controllers, service/domain/repository layering, DTO validation, guards. Load for any task under apps/api.
---

# Xandevo — Backend Rules

Full detail: `docs/architecture/backend-architecture.md`. Checklist:

## Modules

- Global: `ConfigModule` (schema-validated env, fail fast), `PrismaModule`, `AiModule`.
- Feature: `AuthModule`, `UsersModule`, `StoresModule`, `GenerationModule`, `HealthModule`.
- Pages/Sections/Products/Categories are **parts of the Store aggregate**, not their own
  modules (no independent lifecycle in MVP).
- A module exports only what others need (usually its service).

## Standard module layout

```
xxx.module.ts | xxx.controller.ts | xxx.service.ts | xxx.repository.ts
guards/ dto/ domain/
```

## Layering

- **Controller:** guards + `@CurrentUser()` + DTO validation + call ONE service method +
  map to response DTO + status code. No business logic.
- **Service:** orchestrates domain functions + repositories + providers. Throws typed domain
  errors (`StoreNotFoundError`, `ValidationError`, `AiGenerationError`, `ForbiddenStoreAccessError`).
- **Repository:** the only place that imports/uses Prisma. Always filter store queries by
  `userId`.
- **domain/:** pure validators/normalizers/sanitizers, unit-testable without Nest.
- A global `AllExceptionsFilter` maps domain errors → the standard error envelope
  (`docs/api/api-contract.md`).

## Validation & security

- Global `ValidationPipe`: `whitelist: true, forbidNonWhitelisted: true, transform: true`.
- Every DTO field has explicit `class-validator` constraints.
- Body limits: global 256 KB; `/generate` prompt ≤ 2 KB; `/stores` definition ≤ 128 KB.
- `@nestjs/throttler`: `/generate` ~10/min/user; mutations ~60/min; reads ~240/min.
- Helmet; CORS = web origin only; auth via `Authorization` bearer only (no cookies on API).
- Client-supplied `definition` is re-run through the full Store Definition pipeline; never
  trusted.

## AI

- Depend on the `AiProvider` token. Vendor SDKs only under `src/ai/providers/`.
- `GenerationService` owns retry/timeout/fallback/logging/cost — not the provider impls.
- Log per generation: provider, promptVersion, attempts, latency, token usage, outcome.
  Never log keys, full prompts, or PII at info level.

## Persistence (ADR-006 — normalized; JSON only for presentation tokens)

- Tables: `User`, `Store`, `Page`, `Category`, `Product`, `sections` base + one
  `<type>_sections` per section type, + `categories_section_items` /
  `product_grid_section_items`. Section content + all cross-entity refs are relational (FKs;
  structured link targets, no raw hrefs). `Store` = `meta` columns + `promptVersion` +
  `schemaVersion` + `theme`/`navigation` jsonb. No whole-definition JSON blob.
- `StoresModule` owns the aggregate: repositories + `store-definition.mapper.ts`
  (`toRows`/`toDefinition`, one branch per section type; round-trip identity).
- Writes = validate definition → `toRows` → ONE transaction (upsert + diff + delete +
  renumber `position`; one-field edit = one UPDATE). Reads = indexed joins → `toDefinition`
  → `{ definition, ... }`.
- All aggregate reads `userId`-scoped. Cascade from `User`; `Product.categoryId` RESTRICT;
  `*_target_*_id` and `product_grid_sections.categoryId` SET NULL.

## Testing

- Unit: services with mocked repos/providers; domain functions pure.
- Integration: real Postgres (Testcontainers) for repositories + guards.
- E2E: Supertest with `FakeAiProvider` and stubbed JWT verification.
