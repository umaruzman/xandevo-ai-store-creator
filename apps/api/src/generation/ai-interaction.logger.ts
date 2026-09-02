import { Injectable, Logger } from '@nestjs/common';

import { type TokenUsage } from '../ai/ai-provider';
import { estimateCostUsd } from '../ai/cost';
import { PrismaService } from '../prisma/prisma.service';

export interface AiInteractionRecord {
  requestId: string;
  userId: string;
  promptVersion: string;
  provider: string;
  model?: string;
  attempt: number;
  repaired?: boolean;
  parseOk: boolean;
  systemPrompt: string;
  userPrompt: string;
  responseRaw?: string;
  parseErrors?: string[];
  latencyMs?: number;
  usage?: TokenUsage;
}

/**
 * Persists one `ai_interactions` row per provider call (retries included) with
 * the exact prompt sent and raw output received. Best-effort: a write failure is
 * logged and swallowed, never surfaced into the generation flow. Disabled unless
 * `AI_LOG_INTERACTIONS=true` — the table holds full prompt text.
 */
@Injectable()
export class AiInteractionLogger {
  private readonly logger = new Logger(AiInteractionLogger.name);
  private readonly enabled = process.env.AI_LOG_INTERACTIONS === 'true';

  constructor(private readonly prisma: PrismaService) {}

  async record(r: AiInteractionRecord): Promise<void> {
    if (!this.enabled) return;
    try {
      await this.prisma.aiInteraction.create({
        data: {
          requestId: r.requestId,
          userId: r.userId,
          promptVersion: r.promptVersion,
          provider: r.provider,
          model: r.model,
          attempt: r.attempt,
          repaired: r.repaired ?? false,
          parseOk: r.parseOk,
          systemPrompt: r.systemPrompt,
          userPrompt: r.userPrompt,
          responseRaw: r.responseRaw,
          parseErrors: r.parseErrors ?? undefined,
          inputTokens: r.usage?.inputTokens,
          outputTokens: r.usage?.outputTokens,
          cacheReadTokens: r.usage?.cacheReadTokens,
          cacheWriteTokens: r.usage?.cacheWriteTokens,
          latencyMs: r.latencyMs,
          costUsd: r.usage && r.model ? estimateCostUsd(r.model, r.usage) : undefined,
        },
      });
    } catch (err) {
      this.logger.warn(`failed to persist ai interaction: ${(err as Error).message}`);
    }
  }
}
