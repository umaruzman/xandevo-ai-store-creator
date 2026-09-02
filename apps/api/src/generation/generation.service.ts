import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import {
  buildStoreDefinition,
  type GenerateStoreResponse,
  StoreDefinitionError,
  storeDefinitionInputSchema,
} from '@xandevo/shared';

import { AI_PROVIDER, type AiProvider, AiProviderError } from '../ai/ai-provider';
import { estimateCostUsd } from '../ai/cost';
import { AiInteractionLogger } from './ai-interaction.logger';
import { AiGenerationError } from './generation.error';
import { DEFAULT_PROMPT_VERSION, PromptBuilder } from './prompt-builder';

const MAX_ATTEMPTS = 3; // 1 initial + 2 repair attempts
const TIMEOUT_MS = 60_000;
const BACKOFF_BASE_MS = 300;
const RETRYABLE_PIPELINE_STAGES = new Set(['schema', 'business']);

export interface GenerateInput {
  prompt: string;
  userId: string;
  requestId: string;
}

type Repair = { priorOutput: unknown; issues: string[] };

@Injectable()
export class GenerationService {
  private readonly logger = new Logger(GenerationService.name);

  constructor(
    @Inject(AI_PROVIDER) private readonly provider: AiProvider,
    private readonly promptBuilder: PromptBuilder,
    @Optional() private readonly interactions?: AiInteractionLogger,
  ) {}

  async generate({ prompt, userId, requestId }: GenerateInput): Promise<GenerateStoreResponse> {
    const clean = this.cleanPrompt(prompt);
    const built = this.promptBuilder.build(DEFAULT_PROMPT_VERSION, clean);
    const startedAt = Date.now();

    let attempt = 0;
    let repair: Repair | undefined;
    let lastFailure: { kind: 'provider' | 'pipeline'; stage?: string; message: string } | undefined;

    while (attempt < MAX_ATTEMPTS) {
      attempt += 1;
      const attemptStart = Date.now();
      try {
        const result = await this.provider.generateStructured({
          system: built.system,
          user: built.user,
          schema: storeDefinitionInputSchema,
          timeoutMs: TIMEOUT_MS,
          promptVersion: built.promptVersion,
          repair,
        });

        // Provider output parsed against the input schema; now the domain pipeline.
        const definition = buildStoreDefinition(result.data);

        void this.interactions?.record({
          requestId,
          userId,
          promptVersion: built.promptVersion,
          provider: this.provider.name,
          model: result.model,
          attempt,
          repaired: Boolean(repair),
          systemPrompt: built.system,
          userPrompt: built.user,
          responseRaw: result.raw,
          parseOk: true,
          latencyMs: Date.now() - attemptStart,
          usage: result.usage,
        });

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
          usage: {
            inputTokens: result.usage.inputTokens,
            outputTokens: result.usage.outputTokens,
          },
        };
      } catch (err) {
        const next = this.classify(err);
        lastFailure = next.failure;

        void this.interactions?.record({
          requestId,
          userId,
          promptVersion: built.promptVersion,
          provider: this.provider.name,
          attempt,
          repaired: Boolean(repair),
          systemPrompt: built.system,
          userPrompt: built.user,
          responseRaw: next.repair ? JSON.stringify(next.repair.priorOutput) : undefined,
          parseOk: false,
          parseErrors: next.repair?.issues,
          latencyMs: Date.now() - attemptStart,
        });

        if (next.retryable && attempt < MAX_ATTEMPTS) {
          repair = next.repair; // may be undefined for transient provider errors
          await this.backoff(attempt);
          continue;
        }
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

  /** Turn a thrown error into: retryable?, a repair payload (if we can build one), and a log record. */
  private classify(err: unknown): {
    retryable: boolean;
    repair?: Repair;
    failure: { kind: 'provider' | 'pipeline'; stage?: string; message: string };
  } {
    if (err instanceof AiProviderError) {
      const repair =
        err.details?.rawOutput !== undefined
          ? { priorOutput: err.details.rawOutput, issues: err.details.issues ?? [err.message] }
          : undefined;
      return {
        retryable: err.retryable,
        repair,
        failure: { kind: 'provider', message: err.message },
      };
    }
    if (err instanceof StoreDefinitionError) {
      return {
        retryable: RETRYABLE_PIPELINE_STAGES.has(err.stage),
        // buildStoreDefinition doesn't hand back the raw input, so a targeted
        // repair isn't possible here — fall back to a blind retry.
        failure: { kind: 'pipeline', stage: err.stage, message: err.message },
      };
    }
    return {
      retryable: false,
      failure: { kind: 'provider', message: (err as Error).message },
    };
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
