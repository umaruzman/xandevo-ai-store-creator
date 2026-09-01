# Scaling & Performance Strategy

Split into **MVP now** and **future scaling** (documented, not built).

## Performance — MVP now  *(verified — Phase 10)*

- **Server Components by default** — every route (`page.tsx`, landing, dashboard,
  `/stores/[storeId]`) is an RSC; only interactive leaves (`CreateStoreFlow`, `StoreEditor`,
  fields, renderer, auth buttons) are `'use client'`. `Providers` wraps children without
  declientising them.
- **Renderer efficiency:** `React.memo` section components; `RendererProvider` context
  memoized on `[theme, categories, products]` so a single-section content edit re-renders
  only that section (tested). Stable `section.id` keys.
- **Caching:** TanStack Query `staleTime: 30 s`, `refetchOnWindowFocus: false`
  (`app/providers.tsx`). BFF route handlers use `apiFetch(..., { cache: 'no-store' })`; RSC
  reads are per-request. No CDN/edge caching of dynamic pages.
- **DB indexes (Phase 3 schema, verified):** `Store(userId)`, `Store(userId, updatedAt DESC)`,
  `Store(userId, slug)` unique, `User.googleSub` / `User.email` unique, every FK indexed,
  `Product(storeId, categoryId)`.
- **No N+1:** `GET /stores` is one `findMany` of summaries; `GET /stores/:id` is one nested
  `include` (Prisma issues a bounded number of queries by relation depth, not per row).
- **Loading/error UX:** `loading.tsx` skeletons + `error.tsx` boundaries on the dashboard and
  store routes; `not-found.tsx` for missing/non-owned stores; `global-error.tsx`.
- **Images:** placeholder previews are inline SVG data URIs; `next/image` is deferred until
  real media upload.
- **Avoid premature work:** no Redis, no queue, no read replicas, no micro-optimisations
  without a measured problem.

## Future scaling — when needed

- **Stateless API:** keep `apps/api` stateless (JWT auth, no in-process session/state) so it
  scales horizontally behind a load balancer. Already true by design.
- **Horizontal scale:** run N API instances + N web instances; sticky sessions not required.
- **PostgreSQL:** vertical first; then connection pooler (PgBouncer), then read replicas for
  list/read endpoints, then partition `Store`/normalized tables by `userId` hash if row
  counts demand it. Sharding only as a last resort.
- **Caching layer:** Redis for hot store reads, rate-limit counters, and generation quotas.
- **Background jobs / queue:** move generation to a job queue (BullMQ) with a worker pool
  when concurrency or long-running post-processing (image generation, SEO) is added; the API
  returns a job id and the web app polls/streams status.
- **AI generation queue:** rate-shape provider calls, retry/backoff centrally, per-provider
  concurrency caps, cost budgets, provider fallback.
- **Object storage:** S3-compatible bucket + CDN for user-uploaded and AI-generated images;
  signed URLs; fetch proxy to prevent SSRF.
- **CDN:** front the web app; cache marketing routes and static assets; published
  storefronts (future) are heavily cacheable / ISR.
- **Tenant isolation:** logical (row-level `userId` scoping) is sufficient long-term for this
  product; revisit schema-per-tenant only for enterprise contracts.
- **Observability:** OpenTelemetry traces across web → api → db/provider; RED metrics
  dashboards; log aggregation; alerting on generation error rate and p95 latency;
  `/health` + `/ready` for orchestration.
- **DB partitioning/sharding:** documented escape hatch; not anticipated within the first
  order of magnitude of growth.

## What NOT to do now

No Kubernetes, no microservices split, no event bus, no CQRS, no multi-region, no
schema-per-tenant, no custom caching infra. Revisit each only against real metrics.
