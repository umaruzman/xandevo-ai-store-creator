import { Injectable, Logger } from '@nestjs/common';
import { validStoreDefinitionInput } from '@xandevo/shared';

import {
  type AiProvider,
  type AiResult,
  AiProviderError,
  type GenerateStructuredArgs,
} from '../ai-provider';

/**
 * Deterministic provider for local dev (no API key) and tests. Returns the
 * reference Store Definition input, lightly themed by keywords in the prompt.
 * Set `AI_PROVIDER=fake`.
 */
@Injectable()
export class FakeAiProvider implements AiProvider {
  readonly name = 'fake' as const;
  private readonly logger = new Logger(FakeAiProvider.name);

  generateStructured<T>(args: GenerateStructuredArgs<T>): Promise<AiResult<T>> {
    const definition = validStoreDefinitionInput();
    const prompt = args.user.toLowerCase();

    if (prompt.includes('minimal') || prompt.includes('scandinavian')) {
      definition.theme.preset = 'minimal';
    } else if (prompt.includes('playful') || prompt.includes('kids') || prompt.includes('fun')) {
      definition.theme.preset = 'playful';
    } else if (prompt.includes('tech') || prompt.includes('gadget')) {
      definition.theme.preset = 'tech';
    }

    const parsed = args.schema.safeParse(definition);
    if (!parsed.success) {
      // Should never happen — the fixture is valid. Surface loudly if the schema drifts.
      throw new AiProviderError('FakeAiProvider fixture no longer matches the schema', false);
    }

    const raw = JSON.stringify(definition);
    this.logger.debug(`fake generation for prompt-version ${args.promptVersion}`);
    return Promise.resolve({
      data: parsed.data,
      usage: { inputTokens: 1200, outputTokens: 2400 },
      raw,
      model: 'fake',
      providerMeta: { fake: true },
    });
  }
}
