import { type StoreDefinitionInput, validStoreDefinitionInput } from '@xandevo/shared';

import {
  type AiProvider,
  type AiResult,
  AiProviderError,
  type GenerateStructuredArgs,
} from '../ai/ai-provider';
import { AiGenerationError } from './generation.error';
import { GenerationService } from './generation.service';
import { PromptBuilder } from './prompt-builder';

/** A provider whose behaviour each test scripts via a queue of outcomes. */
class ScriptedProvider implements AiProvider {
  readonly name = 'fake' as const;
  calls = 0;
  constructor(private readonly script: (attempt: number) => AiResult<unknown> | Error) {}
  generateStructured<T>(_args: GenerateStructuredArgs<T>): Promise<AiResult<T>> {
    this.calls += 1;
    const outcome = this.script(this.calls);
    if (outcome instanceof Error) return Promise.reject(outcome);
    return Promise.resolve(outcome as AiResult<T>);
  }
}

const ok = (data: StoreDefinitionInput): AiResult<unknown> => ({
  data,
  usage: { inputTokens: 100, outputTokens: 200 },
  raw: JSON.stringify(data),
  model: 'fake',
  providerMeta: {},
});

const run = (provider: AiProvider) => {
  const service = new GenerationService(provider, new PromptBuilder());
  jest.spyOn(service as unknown as { backoff: () => Promise<void> }, 'backoff').mockResolvedValue();
  return service.generate({
    prompt: 'a luxury perfume store for the UAE',
    userId: 'u1',
    requestId: 'r1',
  });
};

describe('GenerationService', () => {
  it('runs the shared pipeline and returns a normalized definition', async () => {
    const res = await run(new ScriptedProvider(() => ok(validStoreDefinitionInput())));
    expect(res.definition.schemaVersion).toBe(1);
    expect(res.definition.pages).toHaveLength(3);
    expect(res.definition.pages[0]!.sections[0]!.id).toMatch(/-/); // ids assigned by normalize
    expect(res.usage).toEqual({ inputTokens: 100, outputTokens: 200 });
    expect(res.promptVersion).toBe('store@v2');
  });

  it('retries a retryable provider error and then succeeds', async () => {
    const provider = new ScriptedProvider((n) =>
      n < 3 ? new AiProviderError('429', true) : ok(validStoreDefinitionInput()),
    );
    const res = await run(provider);
    expect(provider.calls).toBe(3);
    expect(res.definition.pages).toHaveLength(3);
  });

  it('gives up with AI_UNAVAILABLE when the provider keeps failing', async () => {
    const provider = new ScriptedProvider(() => new AiProviderError('529', true));
    await expect(run(provider)).rejects.toMatchObject({
      name: 'AiGenerationError',
      reason: 'provider_unavailable',
    });
    expect(provider.calls).toBe(3);
  });

  it('does not retry a non-retryable provider error', async () => {
    const provider = new ScriptedProvider(() => new AiProviderError('401', false));
    await expect(run(provider)).rejects.toBeInstanceOf(AiGenerationError);
    expect(provider.calls).toBe(1);
  });

  it('retries then fails with invalid_output when the model output is schema-invalid', async () => {
    const provider = new ScriptedProvider(() => ok({ meta: { name: 'x' } } as never));
    await expect(run(provider)).rejects.toMatchObject({
      reason: 'invalid_output',
      failureStage: 'schema',
    });
    expect(provider.calls).toBe(3);
  });

  it('fails with invalid_output (business) on a dangling reference', async () => {
    const bad = validStoreDefinitionInput();
    bad.products[0]!.categorySlug = 'ghost';
    const provider = new ScriptedProvider(() => ok(bad));
    await expect(run(provider)).rejects.toMatchObject({
      reason: 'invalid_output',
      failureStage: 'business',
    });
  });

  it('feeds the invalid output + errors back as a repair turn, then succeeds', async () => {
    const seen: Array<GenerateStructuredArgs<unknown>['repair']> = [];
    const badOutput = { meta: { name: 'x' } };
    const provider: AiProvider = {
      name: 'fake',
      generateStructured: <T>(args: GenerateStructuredArgs<T>): Promise<AiResult<T>> => {
        seen.push(args.repair);
        if (seen.length === 1) {
          return Promise.reject(
            new AiProviderError('schema', true, undefined, {
              rawOutput: badOutput,
              issues: ['meta.currency: Required', 'theme: Required'],
            }),
          );
        }
        return Promise.resolve(ok(validStoreDefinitionInput()) as AiResult<T>);
      },
    };
    const res = await run(provider);
    expect(res.definition.pages).toHaveLength(3);
    expect(seen[0]).toBeUndefined(); // first attempt: no repair
    expect(seen[1]).toEqual({
      priorOutput: badOutput,
      issues: ['meta.currency: Required', 'theme: Required'],
    });
  });

  it('sanitizes injected markup and still returns a definition', async () => {
    const withInjection = validStoreDefinitionInput();
    const hero = withInjection.pages[0]!.sections[0]!;
    if (hero.type === 'hero') hero.description = 'Oud<script>evil()</script> perfumery.';
    const res = await run(new ScriptedProvider(() => ok(withInjection)));
    const outHero = res.definition.pages[0]!.sections[0]!;
    if (outHero.type === 'hero') expect(outHero.description).toBe('Oud perfumery.');
  });
});
