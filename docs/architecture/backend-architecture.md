# Backend Architecture (`apps/api`)

NestJS, TypeScript, modular architecture with dependency injection, PostgreSQL + Prisma.

## 1. Guiding rules

- **Thin controllers** — parse/authorize/delegate/return. No business logic.
- **Services own use cases** — one service method per meaningful operation; orchestrates
  domain logic + repositories + providers.
- **Domain logic is pure where possible** — validation, normalization, ordering rules live
  in plain functions/classes, unit-testable without Nest.
- **Repositories wrap Prisma** — services never import `PrismaClient` directly; they depend
  on repository classes. Keeps data access swappable and mockable.
- **DTOs validate input** — `class-validator` + global `ValidationPipe` (`whitelist: true`,
  `forbidNonWhitelisted: true`, `transform: true`).
- **Modules expose a narrow surface** — export only what other modules need (usually a service).

## 2. Module map

| Module | Responsibility |
|---|---|
| `ConfigModule` (global) | Typed, schema-validated env. Fails fast. |
| `PrismaModule` (global) | `PrismaService` (lifecycle-managed client). |
| `AiModule` (global) | `AiProvider` interface + provider impls; factory picks impl from config. |
| `AuthModule` | Verify JWT from web, `JwtStrategy`, `JwtAuthGuard`, current-user decorator. |
| `UsersModule` | User provisioning (upsert on first login by Google `sub`), `GET /me`. |
| `StoresModule` | CRUD for stores; owns the Store aggregate (Pages, Sections, Categories, Products) via repositories + the Store Definition ⇄ rows mapper; `StoreOwnerGuard`. |
| `GenerationModule` | `POST /generate`: prompt construction, provider call, validate/normalize → Store Definition. |
| `HealthModule` | `/health`, `/ready`. |

**Why no separate Pages / Sections / Products modules for MVP:** the data model is fully
normalized (ADR-006) but these entities have no lifecycle or API independent of a Store in
the MVP — they are created, edited, and deleted only as part of saving a Store. `StoresModule`
persists them as an aggregate: one repository per table, all writes in a single transaction,
decomposition/assembly handled by `store-definition.mapper.ts`. Split into their own modules
only when per-entity endpoints (e.g. `PATCH /products/:id`) become real requirements.

## 3. Standard module layout

```
src/stores/
  stores.module.ts
  stores.controller.ts      thin HTTP layer
  stores.service.ts         use cases: create, list, get, update, delete
  repositories/            store, page, section (+ per-type), category, product, section-items
    store.repository.ts    Prisma access, all reads userId-scoped
    ...
  guards/store-owner.guard.ts
  dto/
    create-store.dto.ts
    update-store.dto.ts
  domain/
    store-definition.validator.ts   wraps shared Zod schema + business rules
    store-definition.normalizer.ts  ordering, defaults, trimming
    store-definition.mapper.ts      Store Definition <-> normalized rows (round-trip identity)
```

## 4. Controller ↔ service contract

- Controller: applies guards (`JwtAuthGuard`, `StoreOwnerGuard`), binds `@CurrentUser()`,
  validates DTO, calls one service method, maps result to response DTO, sets status code.
- Service: pure orchestration; throws typed domain exceptions
  (`StoreNotFoundError`, `ValidationError`, `AiGenerationError`, `ForbiddenStoreAccessError`).
- A global `AllExceptionsFilter` maps domain exceptions → the standard HTTP error envelope
  (see `docs/api/api-contract.md`).

## 5. Clean architecture, applied pragmatically

```
Presentation (controllers, DTOs, guards, filters)
      ↓ depends on
Application (services)
      ↓ depends on
Domain (Store Definition schema + pure validators/normalizers, domain errors)
      ↑ implemented by
Infrastructure (Prisma repositories, AiProvider impls, config, JWT verification)
```

- **Business rules** live in `*/domain/` functions and services.
- **Database access** lives only in `*.repository.ts`.
- **External AI providers** live only in `src/ai/providers/`; the rest of the app sees
  `AiProvider`.
- **Authentication logic** (token verification, user context) lives only in `AuthModule`;
  authorization (ownership) lives in guards + service checks close to the resource.
- We deliberately **skip** per-model entity classes, mapper layers, and repository interfaces
  with single implementations until a second implementation or a real seam appears.

## 6. AiModule detail

```ts
export interface AiProvider {
  generateStructured<T>(args: {
    system: string;
    user: string;
    schema: ZodSchema<T>;
    timeoutMs: number;
    signal?: AbortSignal;
  }): Promise<{ data: T; usage: TokenUsage; providerMeta: Record<string, unknown> }>;
}
```

- `AI_PROVIDER` env (`openai` | `anthropic` | `gemini`) selects the implementation via a Nest
  factory provider bound to the `AiProvider` token.
- Implementations translate to each vendor SDK, request JSON/structured output, and throw
  `AiProviderError` (with `retryable` flag) on transport/timeout/parse failure.
- Vendor SDKs are imported **only** inside `src/ai/providers/`.
- See `docs/architecture/ai-architecture.md` for retry/timeout/fallback/logging.

## 7. GenerationModule pipeline

`prompt` → `PromptBuilder.build(promptVersion, userPrompt)` → `AiProvider.generateStructured`
→ (Zod schema already enforced by provider return) → `StoreDefinitionValidator.assert` (business
rules: price ranges, counts, content length, allowed section types) →
`ContentSanitizer.clean` (strip HTML/scripts, collapse whitespace, cap lengths) →
`StoreDefinitionNormalizer.normalize` (assign ids, sequential `order`, fill safe defaults) →
return `StoreDefinition`. Never persists. Never returns partial/unvalidated data.

## 8. Persistence approach (ADR-006 — fully normalized)

- Normalized tables (`docs/database/data-model.md`): `User`, `Store`, `Page`, `Category`,
  `Product`, `sections` base + one `<type>_sections` content table per section type, plus
  `categories_section_items` / `product_grid_section_items` join tables. Section content and
  every cross-entity reference are relational (FKs). `Store` holds `meta` columns +
  `promptVersion` + `schemaVersion` + **`theme` / `navigation` `jsonb`** (bounded
  presentation tokens only — no JSON definition blob).
- The **Store Definition** (shared Zod schema) stays the contract for generation, validation,
  rendering, and the editor. It is not the storage format.
- `store-definition.mapper.ts`: `toRows(definition)` and `toDefinition(rows)`. Round-trip is
  identity after normalization (tested).
- Writes (`POST`/`PATCH /stores`): validate definition → `toRows` → **single transaction**
  upserting `Store` and diff-upserting children, deleting removed rows, renumbering `order`.
- Reads (`GET /stores/:id`): bounded indexed queries for the aggregate → `toDefinition` →
  return `{ definition, ... }` on the wire.
- Every repository read is `userId`-scoped (via the parent `Store`). `Product.categoryId`
  is `ON DELETE RESTRICT`; the rest cascade from `User`.

## 9. Validation, security, limits

- Global `ValidationPipe` as above; `class-transformer` for typing.
- Body size limit (e.g. 256 KB) on all routes; stricter on `/generate` (prompt ≤ 2 KB).
- Rate limiting via `@nestjs/throttler`: tight on `/generate` (e.g. 10/min/user), looser
  elsewhere.
- Helmet, CORS locked to the web origin, `Authorization`-only auth (no cookies on the API).
- Full analysis: `docs/architecture/security.md`.

## 10. Testing

- Unit: services with mocked repositories/providers; domain validators/normalizers pure.
- Integration: module + real Postgres (Testcontainers) for repositories and guards.
- E2E: Supertest against the full app with `AiProvider` and JWT verification stubbed.
- See `.claude/skills/testing/SKILL.md`.
