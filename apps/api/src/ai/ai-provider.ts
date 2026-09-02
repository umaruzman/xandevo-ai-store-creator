import { type ZodType } from 'zod';

/** DI token for the configured provider. */
export const AI_PROVIDER = Symbol('AI_PROVIDER');

export type AiProviderName = 'anthropic' | 'openai' | 'gemini' | 'fake';

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  /** Set by providers that support prompt caching. */
  cacheReadTokens?: number;
  cacheWriteTokens?: number;
}

export interface AiResult<T> {
  data: T;
  usage: TokenUsage;
  /** Raw model output (JSON string). Logged only at debug, never returned to clients. */
  raw: string;
  model: string;
  providerMeta: Record<string, unknown>;
}

export interface GenerateStructuredArgs<T> {
  system: string;
  user: string;
  /** The Zod schema the output must satisfy. The impl re-parses regardless of vendor guarantees. */
  schema: ZodType<T>;
  timeoutMs: number;
  promptVersion: string;
  signal?: AbortSignal;
  /**
   * Present on a retry: the previous invalid tool output and the exact
   * validation errors. The impl replays it as a tool_result so the model
   * corrects its own output instead of regenerating blind.
   */
  repair?: { priorOutput: unknown; issues: string[] };
}

/**
 * The internal AI contract (ADR-004). Application code depends on this, never on
 * a vendor SDK. Implementations live only in `src/ai/providers/`.
 */
export interface AiProvider {
  readonly name: AiProviderName;
  generateStructured<T>(args: GenerateStructuredArgs<T>): Promise<AiResult<T>>;
}

/** Thrown by provider implementations. `retryable` drives the retry loop. */
export class AiProviderError extends Error {
  constructor(
    message: string,
    readonly retryable: boolean,
    override readonly cause?: unknown,
    /** Set on a schema-validation failure so the service can build a repair turn. */
    readonly details?: { rawOutput?: unknown; issues?: string[] },
  ) {
    super(message);
    this.name = 'AiProviderError';
  }
}
