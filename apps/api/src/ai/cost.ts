import { type TokenUsage } from './ai-provider';

/** USD per 1M tokens. Approximate list prices for cost visibility in logs only. */
const RATES: Record<string, { input: number; output: number }> = {
  'claude-sonnet-5': { input: 3, output: 15 },
  'claude-opus-5': { input: 15, output: 75 },
  'claude-haiku-4-5-20251001': { input: 1, output: 5 },
  fake: { input: 0, output: 0 },
};

const FALLBACK = { input: 3, output: 15 };

export function estimateCostUsd(model: string, usage: TokenUsage): number {
  const rate = RATES[model] ?? FALLBACK;
  const usd = (usage.inputTokens * rate.input + usage.outputTokens * rate.output) / 1_000_000;
  return Math.round(usd * 1e6) / 1e6;
}
