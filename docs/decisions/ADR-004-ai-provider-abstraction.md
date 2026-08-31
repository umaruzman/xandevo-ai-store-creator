# ADR-004 — AI Provider Abstraction

- **Status:** Accepted (Phase 1)
- **Date:** 2026-08-31

## Context

Generation may use OpenAI, Anthropic, or Gemini. Pricing, availability, and structured-output
APIs differ and change. Coupling the app to one vendor is risky.

## Decision

Define an internal `AiProvider` interface (types in `packages/shared`, implementations in
`apps/api/src/ai/providers/`):

```ts
interface AiProvider {
  readonly name: 'openai' | 'anthropic' | 'gemini';
  generateStructured<T>(args: {
    system: string; user: string; schema: ZodSchema<T>;
    timeoutMs: number; signal?: AbortSignal; promptVersion: string;
  }): Promise<AiResult<T>>;
}
```

- A Nest factory binds the `AiProvider` token from `AI_PROVIDER` env. **Default for MVP:
  `anthropic`** (resolved 2026-09-01). No fallback provider configured for MVP.
- Vendor SDK imports are **only** allowed under `src/ai/providers/` (lint-enforced).
- Every impl re-parses and `schema.safeParse`s the response and throws `AiProviderError`
  with a `retryable` flag.
- Cross-cutting concerns (retry, timeout, fallback, logging, cost) live in
  `GenerationService` / a thin decorator, not in each impl.
- Optional `AI_FALLBACK_PROVIDER` for one fallback attempt after retries.

## Rationale

- Swap or A/B providers via config; no application changes.
- Uniform error/retry semantics regardless of vendor.
- Keys and vendor coupling contained to one directory.

## Consequences

- Must map each vendor's structured-output mechanism to the common interface.
- Slight abstraction overhead — justified by ≥3 concrete target implementations.

## Alternatives rejected

- **Direct SDK calls in `GenerationService`:** vendor lock-in, scattered error handling.
- **Third-party gateway (LiteLLM etc.):** extra infra + dependency for MVP; revisit at scale.
