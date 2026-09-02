import { Injectable, Logger } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import { zodToJsonSchema } from 'zod-to-json-schema';

import {
  type AiProvider,
  type AiResult,
  AiProviderError,
  type GenerateStructuredArgs,
} from '../ai-provider';

const TOOL_NAME = 'emit_store_definition';
const DEFAULT_MODEL = 'claude-sonnet-5';

/**
 * Anthropic implementation. The ONLY place `@anthropic-ai/sdk` may be imported.
 * Forces structured output via a single required tool whose `input_schema` is
 * derived from the Zod schema; the result is still re-parsed here.
 */
@Injectable()
export class AnthropicProvider implements AiProvider {
  readonly name = 'anthropic' as const;
  private readonly logger = new Logger(AnthropicProvider.name);
  private readonly client: Anthropic;
  private readonly model: string;

  constructor() {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error('ANTHROPIC_API_KEY is required when AI_PROVIDER=anthropic');
    this.client = new Anthropic({ apiKey, maxRetries: 0 });
    this.model = process.env.ANTHROPIC_MODEL || DEFAULT_MODEL;
  }

  async generateStructured<T>(args: GenerateStructuredArgs<T>): Promise<AiResult<T>> {
    const inputSchema = zodToJsonSchema(args.schema, { $refStrategy: 'none' }) as Record<
      string,
      unknown
    >;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), args.timeoutMs);
    if (args.signal)
      args.signal.addEventListener('abort', () => controller.abort(), { once: true });

    const messages: Anthropic.MessageParam[] = [{ role: 'user', content: args.user }];
    if (args.repair) {
      messages.push({
        role: 'assistant',
        content: [
          { type: 'tool_use', id: 'repair_0', name: TOOL_NAME, input: args.repair.priorOutput },
        ],
      });
      messages.push({
        role: 'user',
        content: [
          {
            type: 'tool_result',
            tool_use_id: 'repair_0',
            is_error: true,
            content:
              `That output failed validation:\n- ${args.repair.issues.join('\n- ')}\n\n` +
              `Call ${TOOL_NAME} again with a fully corrected value. Fix only what the errors name; keep everything else.`,
          },
        ],
      });
    }

    let response: Anthropic.Message;
    try {
      response = await this.client.messages.create(
        {
          model: this.model,
          max_tokens: 8000,
          // Cache the static prefix (tools + system schema + worked example);
          // only the user message and any repair turn vary between calls.
          // `cache_control` is valid at runtime — the pinned SDK 0.32 types
          // predate GA prompt caching, hence the cast.
          system: [
            { type: 'text', text: args.system, cache_control: { type: 'ephemeral' } },
          ] as unknown as Anthropic.MessageCreateParamsNonStreaming['system'],
          messages,
          tools: [
            {
              name: TOOL_NAME,
              description: 'Return the complete Store Definition as structured data.',
              input_schema: inputSchema as Anthropic.Tool.InputSchema,
            },
          ],
          tool_choice: { type: 'tool', name: TOOL_NAME },
        },
        { signal: controller.signal },
      );
    } catch (err) {
      throw this.toProviderError(err);
    } finally {
      clearTimeout(timer);
    }

    const toolUse = response.content.find(
      (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use',
    );
    if (!toolUse) {
      throw new AiProviderError('model did not return the tool call', true);
    }

    const raw = JSON.stringify(toolUse.input);
    const parsed = args.schema.safeParse(toolUse.input);
    if (!parsed.success) {
      const issues = parsed.error.issues.map(
        (i) => `${i.path.join('.') || '(root)'}: ${i.message}`,
      );
      this.logger.debug(`schema parse failed: ${issues.slice(0, 5).join('; ')}`);
      throw new AiProviderError('model output failed schema validation', true, parsed.error, {
        rawOutput: toolUse.input,
        issues,
      });
    }

    const usage = response.usage as typeof response.usage & {
      cache_read_input_tokens?: number | null;
      cache_creation_input_tokens?: number | null;
    };
    return {
      data: parsed.data,
      usage: {
        inputTokens: usage.input_tokens,
        outputTokens: usage.output_tokens,
        cacheReadTokens: usage.cache_read_input_tokens ?? undefined,
        cacheWriteTokens: usage.cache_creation_input_tokens ?? undefined,
      },
      raw,
      model: this.model,
      providerMeta: {
        stopReason: response.stop_reason,
        id: response.id,
        repaired: Boolean(args.repair),
      },
    };
  }

  private toProviderError(err: unknown): AiProviderError {
    if (err instanceof Anthropic.APIUserAbortError) {
      return new AiProviderError('request timed out', true, err);
    }
    if (err instanceof Anthropic.APIConnectionError) {
      return new AiProviderError('connection error', true, err);
    }
    if (err instanceof Anthropic.APIError) {
      const status = err.status ?? 0;
      const retryable = status === 429 || status >= 500;
      return new AiProviderError(`anthropic API error (${status})`, retryable, err);
    }
    return new AiProviderError('unexpected provider error', false, err);
  }
}
