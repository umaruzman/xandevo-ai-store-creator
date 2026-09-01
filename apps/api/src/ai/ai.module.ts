import { Global, Module, type Provider } from '@nestjs/common';

import { AI_PROVIDER, type AiProvider, type AiProviderName } from './ai-provider';
import { AnthropicProvider } from './providers/anthropic.provider';
import { FakeAiProvider } from './providers/fake.provider';

const providerFactory: Provider = {
  provide: AI_PROVIDER,
  useFactory: (): AiProvider => {
    const name = (process.env.AI_PROVIDER ?? 'anthropic') as AiProviderName;
    switch (name) {
      case 'anthropic':
        return new AnthropicProvider();
      case 'fake':
        return new FakeAiProvider();
      case 'openai':
      case 'gemini':
        throw new Error(
          `AI_PROVIDER="${name}" is not implemented yet (ADR-004: add under src/ai/providers/)`,
        );
      default:
        throw new Error(`unknown AI_PROVIDER="${String(name)}"`);
    }
  },
};

@Global()
@Module({
  providers: [providerFactory],
  exports: [AI_PROVIDER],
})
export class AiModule {}
