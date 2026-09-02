import { type TokenUsage } from './ai-provider';

/** USD per 1M tokens. Approximate list prices for cost visibility in logs only. */
const RATES: Record<string, { input: number; output: number }> = {
  'claude-sonnet-5': { input: 3, output: 15 },
  'claude-opus-5': { input: 15, output: 75 },
  'claude-haiku-4-5-20251001': { input: 1, output: 5 },
  fake: { input: 0, output: 0 },
};

const FALLBACK = { input: 3, output: 15 };

// Prompt-cache multipliers on the input rate (Anthropic): a read is 0.1x, a
// one-time write is 1.25x. `usage.inputTokens` already excludes cached tokens.
const CACHE_READ_MULT = 0.1;
const CACHE_WRITE_MULT = 1.25;

export function estimateCostUsd(model: string, usage: TokenUsage): number {
  const rate = RATES[model] ?? FALLBACK;
  const usd =
    (usage.inputTokens * rate.input +
      (usage.cacheReadTokens ?? 0) * rate.input * CACHE_READ_MULT +
      (usage.cacheWriteTokens ?? 0) * rate.input * CACHE_WRITE_MULT +
      usage.outputTokens * rate.output) /
    1_000_000;
  return Math.round(usd * 1e6) / 1e6;
}
