// @vitest-environment node
import {
  buildStoreDefinition,
  sequentialIdFactory,
  THEME_PRESETS,
  validStoreDefinitionInput,
} from '@xandevo/shared';
import { describe, expect, it } from 'vitest';

import { resolveThemeVars } from './theme-vars';

const themeForPreset = (preset: string) => {
  const input = validStoreDefinitionInput();
  input.theme.preset = preset as never;
  delete (input.theme as { style?: unknown }).style; // let the preset supply defaults
  return buildStoreDefinition(input, { idFactory: sequentialIdFactory() }).theme;
};

describe('resolveThemeVars', () => {
  it('maps colours, typography and style tokens to --sf-* properties', () => {
    const vars = resolveThemeVars(themeForPreset('luxury')) as Record<string, string>;
    expect(vars['--sf-primary']).toMatch(/^#/);
    expect(vars['--sf-font-heading']).toContain('Georgia'); // serif-sans pairing
    expect(vars['--sf-radius']).toBe('4px'); // luxury -> radius sm
    expect(vars['--sf-primary-contrast']).toMatch(/^#(111111|ffffff)$/);
  });

  it('each of the 6 presets yields a distinct variable set (matrix)', () => {
    const serialized = THEME_PRESETS.map((p) =>
      JSON.stringify(resolveThemeVars(themeForPreset(p))),
    );
    expect(new Set(serialized).size).toBe(THEME_PRESETS.length);
  });

  it('button radius follows buttonShape', () => {
    const t = themeForPreset('playful'); // playful -> buttonShape pill
    expect((resolveThemeVars(t) as Record<string, string>)['--sf-button-radius']).toBe('9999px');
  });
});
