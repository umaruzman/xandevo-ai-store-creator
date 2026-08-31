# Scaling & Performance Strategy

Split into **MVP now** and **future scaling** (documented, not built).

## Performance — MVP now

- **Server Components by default** in `apps/web`; ship minimal client JS. Client boundaries
  only around builder/editor/renderer.
- **Renderer efficiency:** memoized section components, selector-based Zustand subscriptions
  so a single field edit re-renders only the affected section, stable ids as keys.
- **Caching:** TanStack Query with sensible `staleTime` for stores list/detail; RSC `fetch`
  cache for read-only data; no premature CDN/edge caching of dynamic pages.
- **DB indexes:** `Store(userId)`, `Store(userId, updatedAt)`, `User(googleSub)` unique,
  `User(email)` unique. Add as the schema is written (Phase 3).
- **API payloads:** return only needed fields; list endpoint returns store summaries
  (no full `definition`), detail returns the full document.
- **AI latency:** generation is a single explicit user action with a progress UI; 60 s
  timeout; no speculative pre-generation. Response streamed to the client only as a final
  validated object (no partial-render of unvalidated data).
- **Images:** `next/image`, placeholder strategy avoids heavy assets in MVP.
- **Avoid premature work:** no Redis, no queue, no read replicas, no micro-optimizations
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
