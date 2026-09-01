# ADR-004 — AI Provider Abstraction

- **Status:** Accepted (Phase 1). **Implemented in Phase 5.**
- **Date:** 2026-08-31

## Implementation (Phase 5)

- `AiProvider` interface + `AI_PROVIDER` DI token in `apps/api/src/ai/ai-provider.ts`;
  `AiModule` (global) binds it via a factory on `process.env.AI_PROVIDER`.
- Implementations under `src/ai/providers/` only (ESLint `no-restricted-imports` forbids
  `@anthropic-ai/sdk` / `openai` / `@google/generative-ai` anywhere else):
  - `AnthropicProvider` (default) — one required tool `emit_store_definition` whose
    `input_schema` is `zodToJsonSchema(storeDefinitionInputSchema)`; the tool input is still
    re-`safeParse`d. Per-attempt `AbortController` timeout. Errors → `AiProviderError` with
    `retryable` (429/5xx/timeout/parse → true; 4xx auth → false). Model via `ANTHROPIC_MODEL`
    (default `claude-sonnet-5`).
  - `FakeAiProvider` — returns the reference fixture; `AI_PROVIDER=fake` for keyless
    dev / CI / e2e.
  - `openai` / `gemini` throw a clear "not implemented" at boot.
- Cross-cutting concerns live in `GenerationService`, not the impls: retry
  (`MAX_ATTEMPTS = 3`, exponential backoff + jitter; retries provider-retryable errors and
  `schema`/`business` pipeline failures), 60 s timeout, structured JSON logging with token
  usage + a cost estimate (`ai/cost.ts`), **no fallback provider for MVP**.
- Terminal failures → `AiGenerationError` → `422 AI_GENERATION_FAILED` (bad output) or
  `503 AI_UNAVAILABLE` (provider) via `AllExceptionsFilter`. Keys never appear in responses
  or logs.

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
