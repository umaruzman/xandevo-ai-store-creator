// @vitest-environment node
import {
  buildStoreDefinition,
  sequentialIdFactory,
  validStoreDefinitionInput,
} from '@xandevo/shared';
import { beforeEach, describe, expect, it } from 'vitest';

import { selectIsDirty, useBuilderStore } from './builder';

const def = () =>
  buildStoreDefinition(validStoreDefinitionInput(), { idFactory: sequentialIdFactory() });

describe('useBuilderStore', () => {
  beforeEach(() => useBuilderStore.getState().reset());

  it('starts idle with no definition', () => {
    const s = useBuilderStore.getState();
    expect(s.generation.status).toBe('idle');
    expect(s.definition).toBeNull();
    expect(selectIsDirty(s)).toBe(false);
  });

  it('startGeneration -> pending', () => {
    useBuilderStore.getState().startGeneration();
    expect(useBuilderStore.getState().generation.status).toBe('pending');
  });

  it('setGenerated stores the definition, marks success, and starts clean (baseline set)', () => {
    useBuilderStore.getState().setGenerated({ definition: def(), promptVersion: 'store@v1' });
    const s = useBuilderStore.getState();
    expect(s.generation.status).toBe('success');
    expect(s.definition?.meta.name).toBe('Maison Oud');
    expect(s.promptVersion).toBe('store@v1');
    expect(s.savedHash).not.toBeNull();
    expect(selectIsDirty(s)).toBe(false); // no edits yet
  });

  it('setGenerationError -> error with message', () => {
    useBuilderStore.getState().setGenerationError('nope');
    expect(useBuilderStore.getState().generation).toEqual({ status: 'error', error: 'nope' });
  });

  it('loadFromServer hydrates and is not dirty until changed', () => {
    const store = { id: 'store-1', definition: def(), promptVersion: 'store@v1' };
    useBuilderStore.getState().loadFromServer(store);
    let s = useBuilderStore.getState();
    expect(s.storeId).toBe('store-1');
    expect(selectIsDirty(s)).toBe(false);

    useBuilderStore.setState({
      definition: { ...s.definition!, meta: { ...s.definition!.meta, name: 'Changed' } },
    });
    s = useBuilderStore.getState();
    expect(selectIsDirty(s)).toBe(true);
  });

  it('markSaved clears the dirty flag for the current definition', () => {
    useBuilderStore.getState().setGenerated({ definition: def(), promptVersion: 'store@v1' });
    const current = useBuilderStore.getState().definition!;
    useBuilderStore
      .getState()
      .markSaved({ id: 's2', definition: current, promptVersion: 'store@v1' });
    expect(selectIsDirty(useBuilderStore.getState())).toBe(false);
  });

  describe('updateField', () => {
    beforeEach(() =>
      useBuilderStore.getState().setGenerated({ definition: def(), promptVersion: 'store@v1' }),
    );

    it('commits a valid edit, marks dirty, and touches nothing but `definition`', () => {
      const before = useBuilderStore.getState();
      const res = before.updateField(['meta', 'name'], 'Renamed Store');
      const after = useBuilderStore.getState();

      expect(res).toEqual({ ok: true });
      expect(after.definition!.meta.name).toBe('Renamed Store');
      expect(selectIsDirty(after)).toBe(true);
      expect(after.generation).toBe(before.generation); // unrelated slice untouched
      expect(after.definition!.categories).toBe(before.definition!.categories); // structural sharing
      expect(after.definition).not.toBe(before.definition);
    });

    it('rejects an invalid edit, leaves the definition unchanged, records the error', () => {
      const before = useBuilderStore.getState().definition;
      const res = useBuilderStore.getState().updateField(['meta', 'name'], '');
      const after = useBuilderStore.getState();

      expect(res.ok).toBe(false);
      expect(after.definition).toBe(before); // not committed
      expect(after.editErrors['meta.name']).toBeTruthy();
    });

    it('rejects a non-hex colour', () => {
      expect(
        useBuilderStore.getState().updateField(['theme', 'colors', 'primary'], 'blue').ok,
      ).toBe(false);
      expect(
        useBuilderStore.getState().updateField(['theme', 'colors', 'primary'], '#0a0a0a').ok,
      ).toBe(true);
    });

    it('a later valid edit clears the earlier error for that path', () => {
      const s = useBuilderStore.getState();
      s.updateField(['meta', 'name'], '');
      expect(useBuilderStore.getState().editErrors['meta.name']).toBeTruthy();
      s.updateField(['meta', 'name'], 'Fine Now');
      expect(useBuilderStore.getState().editErrors['meta.name']).toBeUndefined();
    });

    it('moveSection reorders and renumbers `order`', () => {
      const def0 = useBuilderStore.getState().definition!;
      const home = def0.pages.find((p) => p.slug === 'home')!;
      const [first, second] = [home.sections[0]!, home.sections[1]!];

      const res = useBuilderStore.getState().moveSection(home.id, first.id, 'down');
      expect(res.ok).toBe(true);

      const homeAfter = useBuilderStore
        .getState()
        .definition!.pages.find((p) => p.slug === 'home')!;
      const ordered = [...homeAfter.sections].sort((a, b) => a.order - b.order);
      expect(ordered[0]!.id).toBe(second.id);
      expect(ordered[1]!.id).toBe(first.id);
      expect(ordered.map((x) => x.order)).toEqual(ordered.map((_, i) => i));
    });

    it('moveSection refuses to move the first section up', () => {
      const home = useBuilderStore.getState().definition!.pages.find((p) => p.slug === 'home')!;
      expect(useBuilderStore.getState().moveSection(home.id, home.sections[0]!.id, 'up').ok).toBe(
        false,
      );
    });
  });

  it('reset returns to the initial state', () => {
    useBuilderStore.getState().setGenerated({ definition: def(), promptVersion: 'store@v1' });
    useBuilderStore.getState().reset();
    const s = useBuilderStore.getState();
    expect(s.definition).toBeNull();
    expect(s.editErrors).toEqual({});
    expect(s.generation.status).toBe('idle');
    expect(s.storeId).toBeNull();
  });
});
