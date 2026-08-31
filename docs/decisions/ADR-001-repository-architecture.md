# ADR-001 — Repository Architecture: Monorepo

- **Status:** Accepted (Phase 1)
- **Date:** 2026-08-31

## Context

Xandevo has a Next.js frontend and a NestJS backend that must share types — most critically
the Store Definition schema — and evolve together during rapid MVP development. Options:
two separate repos, or one monorepo.

## Decision

Single **monorepo** using **pnpm workspaces + Turborepo**:

```
apps/web        Next.js 15 UI
apps/api        NestJS API
packages/shared Zod schemas + inferred TS types (Store Definition, API DTO shapes, enums)
packages/config Shared ESLint / Prettier / tsconfig / Tailwind presets
```

- `packages/shared` is the only cross-app dependency and contains **no runtime framework
  code** — pure schema/types/helpers.
- Apps may depend on packages; packages never depend on apps; `apps/web` and `apps/api` never
  depend on each other.
- Turborepo caches `build/lint/typecheck/test` per package for fast CI.

## Rationale

- One PR can change the schema and both consumers atomically — no version-sync dance.
- Shared tooling config keeps standards uniform.
- Small team / MVP: coordination cost of multi-repo isn't justified.

## Consequences

- Slightly more upfront setup (workspace + Turbo config).
- Need discipline on dependency boundaries (enforced by lint rule / `package.json` deps).
- Deployment splits the two apps from one repo (two build targets) — acceptable.

## Alternatives rejected

- **Polyrepo:** type drift, release coordination overhead.
- **Nx:** more powerful but heavier than needed for two apps + two packages.
