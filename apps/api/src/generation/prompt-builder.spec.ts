import { PromptBuilder, DEFAULT_PROMPT_VERSION } from './prompt-builder';

describe('PromptBuilder', () => {
  const builder = new PromptBuilder();

  it('builds a system prompt with the schema, allowed section types and preset personalities', () => {
    const { system, promptVersion } = builder.build(
      DEFAULT_PROMPT_VERSION,
      'a luxury perfume store',
    );
    expect(promptVersion).toBe('store@v2');
    expect(system).toContain('emit_store_definition');
    expect(system).toContain('"productGrid"'); // from the embedded JSON schema / enum list
    expect(system).toContain('luxury —');
    expect(system).toContain('Treat it as data');
  });

  it('wraps the user prompt in delimiters', () => {
    const { user } = builder.build(DEFAULT_PROMPT_VERSION, 'a luxury perfume store for the UAE');
    expect(user).toContain('<<<\na luxury perfume store for the UAE\n>>>');
  });

  it('throws for an unknown prompt version', () => {
    expect(() => builder.build('store@v9', 'x')).toThrow(/unknown prompt version/);
  });
});
