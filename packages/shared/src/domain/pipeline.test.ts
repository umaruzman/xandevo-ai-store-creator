import { describe, expect, it } from 'vitest';

import { validStoreDefinitionInput } from '../testing/fixtures.js';
import { sequentialIdFactory } from '../testing/ids.js';
import { StoreDefinitionError } from './errors.js';
import { buildStoreDefinition } from './pipeline.js';

const build = (raw: unknown) => buildStoreDefinition(raw, { idFactory: sequentialIdFactory() });

describe('buildStoreDefinition', () => {
  it('takes a valid input object to a trusted definition', () => {
    const def = build(validStoreDefinitionInput());
    expect(def.schemaVersion).toBe(1);
    expect(def.pages).toHaveLength(3);
  });

  it('accepts a JSON string', () => {
    const def = build(JSON.stringify(validStoreDefinitionInput()));
    expect(def.meta.name).toBe('Maison Oud');
  });

  it('rejects malformed JSON at the parse stage', () => {
    expect.assertions(2);
    try {
      build('{ not json');
    } catch (err) {
      expect(err).toBeInstanceOf(StoreDefinitionError);
      expect((err as StoreDefinitionError).stage).toBe('parse');
    }
  });

  it('rejects a shape violation at the schema stage', () => {
    const bad = validStoreDefinitionInput() as Record<string, unknown>;
    delete bad.meta;
    expect.assertions(2);
    try {
      build(bad);
    } catch (err) {
      expect(err).toBeInstanceOf(StoreDefinitionError);
      expect((err as StoreDefinitionError).stage).toBe('schema');
    }
  });

  it('rejects a dangling reference at the business stage', () => {
    const input = validStoreDefinitionInput();
    input.products[0]!.categorySlug = 'does-not-exist';
    expect.assertions(2);
    try {
      build(input);
    } catch (err) {
      expect(err).toBeInstanceOf(StoreDefinitionError);
      expect((err as StoreDefinitionError).stage).toBe('business');
    }
  });

  it('strips an injected script and still normalizes', () => {
    const input = validStoreDefinitionInput();
    const hero = input.pages[0]!.sections[0]!;
    if (hero.type === 'hero') hero.description = 'Luxury oud<script>steal()</script> perfumery.';
    const def = build(input);
    const outHero = def.pages[0]!.sections[0]!;
    if (outHero.type === 'hero') {
      expect(outHero.description).toBe('Luxury oud perfumery.');
    }
  });

  it('rejects oversized content that survives as an over-limit string', () => {
    const input = validStoreDefinitionInput();
    const hero = input.pages[0]!.sections[0]!;
    if (hero.type === 'hero') hero.headline = 'x'.repeat(500);
    expect.assertions(2);
    try {
      build(input);
    } catch (err) {
      expect(err).toBeInstanceOf(StoreDefinitionError);
      expect((err as StoreDefinitionError).stage).toBe('schema');
    }
  });
});
