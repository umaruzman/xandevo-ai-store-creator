import { validStoreDefinitionInput } from '@xandevo/shared';

/**
 * A recorded-shape Anthropic `messages.create` response: one `tool_use` block
 * whose input is a valid Store Definition input. Used by the provider contract
 * test — no network, no key.
 */
export function anthropicToolUseResponse(): {
  id: string;
  type: 'message';
  role: 'assistant';
  model: string;
  stop_reason: 'tool_use';
  content: { type: 'tool_use'; id: string; name: string; input: unknown }[];
  usage: { input_tokens: number; output_tokens: number };
} {
  return {
    id: 'msg_fixture_1',
    type: 'message',
    role: 'assistant',
    model: 'claude-sonnet-5',
    stop_reason: 'tool_use',
    content: [
      {
        type: 'tool_use',
        id: 'toolu_fixture_1',
        name: 'emit_store_definition',
        input: validStoreDefinitionInput(),
      },
    ],
    usage: { input_tokens: 1834, output_tokens: 3120 },
  };
}
