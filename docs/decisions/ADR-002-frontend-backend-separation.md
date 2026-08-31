# ADR-002 — Frontend / Backend Separation

- **Status:** Accepted (Phase 1)
- **Date:** 2026-08-31

## Context

Next.js 15 can host backend logic (route handlers, server actions). We also have a dedicated
NestJS API. We must decide where authoritative business logic, persistence, and AI calls live.

## Decision

**NestJS (`apps/api`) is the system of record.** It owns: persistence, all business rules,
the AI generation pipeline, provider keys, authorization, rate limiting.

`apps/web` owns: rendering, builder/editor UX, client state, and calling the API. Next.js
server code (RSC `fetch`, occasional server actions) only **proxies** to the API and handles
the browser session; it never talks to the database or an AI provider directly.

## Rationale

- Keeps secrets and expensive/dangerous operations on one hardened, independently scalable,
  stateless service.
- Clear contract (REST + shared types) makes both sides testable in isolation.
- NestJS gives structured modularity/DI that App Router route handlers don't.
- Avoids duplicating validation/authorization logic across two runtimes.

## Consequences

- One extra network hop for reads; mitigated by RSC-side fetching and caching.
- Must maintain an explicit API contract (`docs/api/api-contract.md`) — desirable anyway.
- Local dev runs two processes (Turborepo `dev`).

## Alternatives rejected

- **Next.js-only (route handlers + Prisma):** loses Nest's module structure; mixes secrets
  and DB into the frontend deploy; harder to scale the AI workload separately.
- **API-only + thin static frontend:** loses RSC benefits and Next.js DX.
