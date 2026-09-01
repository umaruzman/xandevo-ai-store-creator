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

    let response: Anthropic.Message;
    try {
      response = await this.client.messages.create(
        {
          model: this.model,
          max_tokens: 8000,
          system: args.system,
          messages: [{ role: 'user', content: args.user }],
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
      this.logger.debug(`schema parse failed: ${parsed.error.message}`);
      throw new AiProviderError('model output failed schema validation', true, parsed.error);
    }

    return {
      data: parsed.data,
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      },
      raw,
      model: this.model,
      providerMeta: { stopReason: response.stop_reason, id: response.id },
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
