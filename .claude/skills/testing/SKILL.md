---
name: testing
description: Xandevo testing strategy — what to unit vs integration vs e2e test, what to mock (AI providers, Google OAuth) vs run real (PostgreSQL), and per-area expectations. Load when writing or changing tests.
---

# Xandevo — Testing Rules

## Tooling

- **API:** Jest + Supertest. Real Postgres via Testcontainers for integration.
- **Web:** Vitest + React Testing Library. Playwright for e2e.
- CI runs `build`, `lint`, `typecheck`, `test` — all must be green. No `.only`, no skipped
  tests merged. Coverage thresholds enforced from Phase 11.

## What to mock vs run real

| Thing | In tests |
|---|---|
| AI providers | **Mock** — `FakeAiProvider` returning canned definitions (valid / malformed / injection / oversized). No real provider calls in CI. |
| Google OAuth | **Mock** — stub the Auth.js provider / JWT verification. |
| PostgreSQL | **Real** in integration/e2e (Testcontainers). Mock only in pure unit tests via repository fakes. |
| HTTP between web↔api | Real in e2e; mocked `apiClient` in web component tests. |

## Backend

- **Unit:** services (mocked repositories + providers); domain validators / normalizers /
  sanitizers — pure, with **adversarial inputs** (malformed JSON, missing fields, wrong
  types, bad prices, oversized content, unknown section types, HTML/script injection,
  prompt-injection payloads).
- **Integration:** repositories + guards against real Postgres; prove every store query is
  `userId`-scoped and cross-user access returns 404.
- **API/e2e:** Supertest through the full app with `FakeAiProvider` + stubbed auth — CRUD,
  validation 422s, auth 401s, ownership 404s, rate limits, body-size limits.
- **AI pipeline:** each stage (schema/business/sanitize/normalize) tested independently plus
  the composed pipeline; provider contract tests vs recorded fixtures.

## Frontend

- **Component:** renderer sections (each type), theme application via CSS variables,
  unknown-section fail-safe, a reference-definition snapshot.
- **Interaction:** prompt form (validation, disabled during generation), editor fields
  (valid edit applies, invalid edit rejected + surfaced), section reorder, dirty indicator.
- **Store:** Zustand builder store unit tests — load/reset, `updateField` validation,
  `isDirty` selector, immutable replacement of `definition`.
- Prefer integration-style tests (render a subtree, interact) over shallow unit tests of
  presentational components.

## End-to-end (Playwright, Phase 11)

Full flow with mocked Google + `FakeAiProvider`: sign in → dashboard → create → prompt →
generate → preview → edit (title, color, text) → save → reload → store restored → sign out.

## Where integration beats unit

Repositories, guards, DTO validation wiring, the composed AI pipeline, and the save/reload
loop — test these through real infrastructure; unit-mocking them tests the mocks.
