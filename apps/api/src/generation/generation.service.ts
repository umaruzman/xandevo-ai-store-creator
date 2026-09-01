import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  buildStoreDefinition,
  type GenerateStoreResponse,
  StoreDefinitionError,
  storeDefinitionInputSchema,
} from '@xandevo/shared';

import { AI_PROVIDER, type AiProvider, AiProviderError } from '../ai/ai-provider';
import { estimateCostUsd } from '../ai/cost';
import { AiGenerationError } from './generation.error';
import { DEFAULT_PROMPT_VERSION, PromptBuilder } from './prompt-builder';

const MAX_ATTEMPTS = 3; // 1 initial + 2 retries
const TIMEOUT_MS = 60_000;
const BACKOFF_BASE_MS = 300;
const RETRYABLE_PIPELINE_STAGES = new Set(['schema', 'business']);

export interface GenerateInput {
  prompt: string;
  userId: string;
  requestId: string;
}

@Injectable()
export class GenerationService {
  private readonly logger = new Logger(GenerationService.name);

  constructor(
    @Inject(AI_PROVIDER) private readonly provider: AiProvider,
    private readonly promptBuilder: PromptBuilder,
  ) {}

  async generate({ prompt, userId, requestId }: GenerateInput): Promise<GenerateStoreResponse> {
    const clean = this.cleanPrompt(prompt);
    const built = this.promptBuilder.build(DEFAULT_PROMPT_VERSION, clean);
    const startedAt = Date.now();

    let attempt = 0;
    let lastFailure: { kind: 'provider' | 'pipeline'; stage?: string; message: string } | undefined;

    while (attempt < MAX_ATTEMPTS) {
      attempt += 1;
      try {
        const result = await this.provider.generateStructured({
          system: built.system,
          user: built.user,
          schema: storeDefinitionInputSchema,
          timeoutMs: TIMEOUT_MS,
          promptVersion: built.promptVersion,
        });

        const definition = buildStoreDefinition(result.data);

        this.log({
          requestId,
          userId,
          promptVersion: built.promptVersion,
          model: result.model,
          attempts: attempt,
          latencyMs: Date.now() - startedAt,
          usage: result.usage,
          outcome: 'success',
        });

        return {
          definition,
          promptVersion: built.promptVersion,
          usage: { inputTokens: result.usage.inputTokens, outputTokens: result.usage.outputTokens },
        };
      } catch (err) {
        if (err instanceof AiProviderError) {
          lastFailure = { kind: 'provider', message: err.message };
          if (err.retryable && attempt < MAX_ATTEMPTS) {
            await this.backoff(attempt);
            continue;
          }
          break;
        }
        if (err instanceof StoreDefinitionError) {
          lastFailure = { kind: 'pipeline', stage: err.stage, message: err.message };
          if (RETRYABLE_PIPELINE_STAGES.has(err.stage) && attempt < MAX_ATTEMPTS) {
            await this.backoff(attempt);
            continue;
          }
          break;
        }
        lastFailure = { kind: 'provider', message: (err as Error).message };
        break;
      }
    }

    this.log({
      requestId,
      userId,
      promptVersion: built.promptVersion,
      attempts: attempt,
      latencyMs: Date.now() - startedAt,
      outcome: 'failure',
      failureKind: lastFailure?.kind,
      failureStage: lastFailure?.stage,
    });

    if (lastFailure?.kind === 'pipeline') {
      throw new AiGenerationError(
        'invalid_output',
        'the generated store failed validation',
        lastFailure.stage,
      );
    }
    throw new AiGenerationError('provider_unavailable', 'the AI provider is unavailable');
  }

  private cleanPrompt(raw: string): string {
    return raw
      .replace(/<[^>]*>/g, '')
      .replace(/[<>]{3,}/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 1000);
  }

  private backoff(attempt: number): Promise<void> {
    const jitter = Math.floor(Math.random() * 100);
    const ms = BACKOFF_BASE_MS * 2 ** (attempt - 1) + jitter;
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private log(fields: Record<string, unknown>): void {
    const costUsd =
      fields.usage && fields.model
        ? estimateCostUsd(
            String(fields.model),
            fields.usage as { inputTokens: number; outputTokens: number },
          )
        : undefined;
    this.logger.log(
      JSON.stringify({ event: 'generation', provider: this.provider.name, costUsd, ...fields }),
    );
  }
}
