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

  it('setGenerated stores the definition, marks success, and is dirty (never saved)', () => {
    useBuilderStore.getState().setGenerated({ definition: def(), promptVersion: 'store@v1' });
    const s = useBuilderStore.getState();
    expect(s.generation.status).toBe('success');
    expect(s.definition?.meta.name).toBe('Maison Oud');
    expect(s.promptVersion).toBe('store@v1');
    expect(s.savedHash).toBeNull();
    expect(selectIsDirty(s)).toBe(true);
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

  it('reset returns to the initial state', () => {
    useBuilderStore.getState().setGenerated({ definition: def(), promptVersion: 'store@v1' });
    useBuilderStore.getState().reset();
    const s = useBuilderStore.getState();
    expect(s.definition).toBeNull();
    expect(s.generation.status).toBe('idle');
    expect(s.storeId).toBeNull();
  });
});
