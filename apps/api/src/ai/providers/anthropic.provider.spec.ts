process.env.ANTHROPIC_API_KEY = 'test-key';

import Anthropic from '@anthropic-ai/sdk';
import { storeDefinitionInputSchema } from '@xandevo/shared';

import { AiProviderError } from '../ai-provider';
import { AnthropicProvider } from './anthropic.provider';
import { anthropicToolUseResponse } from './__fixtures__/anthropic-tool-use';

type Create = jest.Mock;

const buildProvider = (): { provider: AnthropicProvider; create: Create } => {
  const provider = new AnthropicProvider();
  const create = jest.fn();
  // Replace the vendor client call — the only external boundary.
  (provider as unknown as { client: { messages: { create: Create } } }).client = {
    messages: { create },
  };
  return { provider, create };
};

const call = (provider: AnthropicProvider) =>
  provider.generateStructured({
    system: 's',
    user: 'u',
    schema: storeDefinitionInputSchema,
    timeoutMs: 1000,
    promptVersion: 'store@v1',
  });

describe('AnthropicProvider', () => {
  it('extracts and validates the tool_use payload from a recorded response', async () => {
    const { provider, create } = buildProvider();
    create.mockResolvedValue(anthropicToolUseResponse());

    const result = await call(provider);

    expect(result.data.meta.name).toBe('Maison Oud');
    expect(result.usage).toEqual({ inputTokens: 1834, outputTokens: 3120 });
    expect(result.model).toBe('claude-sonnet-5');
    expect(create).toHaveBeenCalledTimes(1);
    const [body] = create.mock.calls[0] as [Record<string, unknown>];
    expect(body.tool_choice).toEqual({ type: 'tool', name: 'emit_store_definition' });
  });

  it('is retryable when the model returns no tool call', async () => {
    const { provider, create } = buildProvider();
    create.mockResolvedValue({
      ...anthropicToolUseResponse(),
      content: [{ type: 'text', text: 'no' }],
    });
    await expect(call(provider)).rejects.toMatchObject({
      name: 'AiProviderError',
      retryable: true,
    });
  });

  it('is retryable when the tool payload fails schema validation', async () => {
    const { provider, create } = buildProvider();
    const bad = anthropicToolUseResponse();
    (bad.content[0] as { input: unknown }).input = { meta: { name: 'x' } };
    create.mockResolvedValue(bad);
    await expect(call(provider)).rejects.toMatchObject({ retryable: true });
  });

  it('maps a 429 to a retryable error and a 401 to a non-retryable one', async () => {
    const { provider, create } = buildProvider();

    const err429 = Object.assign(new Anthropic.APIError(429, undefined, 'rate', undefined), {
      status: 429,
    });
    create.mockRejectedValueOnce(err429);
    await expect(call(provider)).rejects.toMatchObject({ retryable: true });

    const err401 = Object.assign(new Anthropic.APIError(401, undefined, 'auth', undefined), {
      status: 401,
    });
    create.mockRejectedValueOnce(err401);
    await expect(call(provider)).rejects.toMatchObject({ retryable: false });
  });

  it('wraps unknown errors as non-retryable', async () => {
    const { provider, create } = buildProvider();
    create.mockRejectedValue(new Error('boom'));
    const error = await call(provider).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(AiProviderError);
    expect((error as AiProviderError).retryable).toBe(false);
  });
});
