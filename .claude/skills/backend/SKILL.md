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

## Auth (Phase 4)

- `JwtAuthGuard` is a global `APP_GUARD` — every route needs a valid API JWT. Opt public
  routes out with `@Public()` (only health so far). Never remove the global guard.
- `JwtStrategy` (`passport-jwt`) verifies signature + `iss` (`xandevo-web`) + `aud`
  (`xandevo-api`) + `exp`; constants from `@xandevo/shared/auth`. `validate` → 
  `UsersService.upsertFromClaims` (keyed by Google `sub`).
- Get the user with `@CurrentUser()`. `AUTH_JWT_SECRET` must match `apps/web`.

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
- `StoresModule` (Phase 9): controller → `StoresService` → `StoresRepository` (ONE repo for
  the whole aggregate, not per-table) + `store-definition.mapper.ts` (`toRows`/`toDefinition`).
  `StoreOwnerGuard` on `/:id` → 404 (not 403) for missing/non-owned.
- Writes = `validateStoreDefinition` (`@xandevo/shared`: schema→sanitize→schema→normalized
  business rules; never trust the client `definition`) → `toRows` → ONE `prisma.$transaction`.
  `PATCH .definition` currently FULL-replaces children (delete products→categories→pages,
  then `createMany` in FK order); row-level minimal diff is a documented follow-up. Reads =
  one nested `include` → `toDefinition` → `{ definition, ... }`; list = summaries only.
- All queries `userId`-scoped (guard + service). Cascade from `User`; `Product.categoryId`
  RESTRICT (replace deletes products first); `*_target_*_id` / `product_grid_sections.categoryId`
  SET NULL.

## Testing

- Unit: services with mocked repos/providers; domain functions pure.
- Integration: real Postgres (Testcontainers) for repositories + guards.
- E2E: Supertest with `FakeAiProvider` and stubbed JWT verification.
