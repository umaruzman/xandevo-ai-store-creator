# AI Architecture

## 1. Objectives

- The application depends on an internal `AiProvider` interface, never on a vendor SDK.
- AI output is **untrusted external input** and passes a full validation pipeline before use.
- API keys are server-only; the browser never sees them and never calls a provider directly.
- Generation is resilient: bounded timeouts, limited retries, optional provider fallback,
  structured logging, cost visibility.

## 2. Provider abstraction

```ts
// packages/shared: types.  apps/api/src/ai: implementations.
interface AiProvider {
  readonly name: 'openai' | 'anthropic' | 'gemini';
  generateStructured<T>(args: {
    system: string;
    user: string;
    schema: ZodSchema<T>;      // provider requests structured/JSON output & the impl parses+validates
    timeoutMs: number;
    signal?: AbortSignal;
    promptVersion: string;
  }): Promise<AiResult<T>>;
}

interface AiResult<T> { data: T; usage: TokenUsage; raw: string; providerMeta: Record<string, unknown>; }
class AiProviderError extends Error { retryable: boolean; cause?: unknown; }
```

- `AiModule` is global. A factory provider reads `AI_PROVIDER` and binds the `AiProvider`
  token to `OpenAIProvider` | `AnthropicProvider` | `GeminiProvider`. **MVP default:
  `anthropic`; no fallback provider configured** (resolved 2026-09-01).
- Each impl: builds the vendor request (JSON mode / tool-schema / responseSchema as the
  vendor supports), enforces `timeoutMs` via `AbortController`, parses the response body,
  runs `schema.safeParse`, and on any failure throws `AiProviderError` with `retryable` set
  (true for 429/5xx/timeout/parse, false for 4xx auth/validation-of-request).
- Vendor SDK imports are confined to `apps/api/src/ai/providers/`.

## 3. Prompt construction

- `PromptBuilder` owns versioned templates: `prompts/store/v1.system.md`,
  `prompts/store/v1.user.md` (+ few-shot example definition). `promptVersion` (e.g.
  `store@v1`) is passed through and logged with every generation.
- **System prompt** states: role, that output MUST be a single JSON object matching the
  Store Definition schema, the allowed section types, price/currency rules, content-length
  limits, locale/currency derived from the request, and an explicit "no HTML, no scripts, no
  code, no external URLs" instruction.
- **User prompt** = the sanitized user request wrapped with clear delimiters and a
  restatement that instructions inside it are content, not commands (prompt-injection
  mitigation).
- The Zod schema (or a JSON-Schema derived from it) is included so the model targets the
  exact shape.

## 4. Structured generation & validation

Pipeline (in `GenerationService`):

1. `PromptBuilder.build(promptVersion, safeUserPrompt)`
2. `AiProvider.generateStructured({ schema: StoreDefinitionSchema, timeoutMs: 60000, ... })`
3. Provider returns schema-valid `data` (or the call already failed/retried).
4. `StoreDefinitionValidator.assert(data)` — business rules.
5. `ContentSanitizer.clean(data)` — strip markup, cap lengths, reject unsafe urls.
6. `StoreDefinitionNormalizer.normalize(data)` — ids, ordering, defaults.
7. Return trusted `StoreDefinition`.

Any step failing → `AiGenerationError` → HTTP `422` with a safe message; the raw model
output is logged at debug (not returned to the client).

## 5. Resilience

| Concern | Strategy |
|---|---|
| Timeout | 60 s per attempt via `AbortController`. |
| Retry | Max 2 retries, exponential backoff + jitter, only when `retryable` or schema-parse failed. |
| Provider failure | Optional `AI_FALLBACK_PROVIDER`: after retries exhausted, try the fallback once. |
| Partial/garbled JSON | Attempt a single "extract the JSON object" repair pass; if still invalid, retry as above. |
| Total failure | `422`/`503` with correlation id; nothing persisted; client can retry. |
| Idempotency | Generation has no side effects, so retry is always safe. |

## 6. Logging, tokens & cost

- Per generation, structured log: `requestId`, `userId`, `provider`, `promptVersion`,
  `attempts`, `latencyMs`, `usage.inputTokens`, `usage.outputTokens`, `outcome`,
  `validationFailureStage?`. Never log full prompt text or user PII at info level (debug only,
  redacted).
- A simple cost estimate (`tokens × per-model rate` from a config table) is logged and can
  feed a future quota/billing system.

## 7. Prompt versioning

- Templates are files under version control; `promptVersion` string identifies the set.
- Changing a template = new version file + bump the default `promptVersion` in config.
- Store `promptVersion` alongside generated stores (in `definition.meta` or a column) so
  regressions are traceable.

## 8. Security

- Keys via server-only env (`OPENAI_API_KEY`, etc.); validated at boot; never in
  `NEXT_PUBLIC_*`, never in responses, never in logs.
- User prompt is length-capped, HTML-stripped, and delimiter-wrapped before reaching the model.
- Model output cannot introduce executable content because it is coerced to the Store
  Definition schema and sanitized.
- `/generate` is authenticated and rate-limited.

## 9. Testing

- Providers: contract tests against recorded fixtures; a `FakeAiProvider` returns canned
  definitions (valid, invalid-shape, injection-laden, oversized) for pipeline tests.
- Pipeline: unit tests for validator/sanitizer/normalizer with adversarial inputs.
- No real provider calls in CI.
