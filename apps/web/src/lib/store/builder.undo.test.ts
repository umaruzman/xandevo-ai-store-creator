// @vitest-environment node
import {
  buildStoreDefinition,
  sequentialIdFactory,
  validStoreDefinitionInput,
} from '@xandevo/shared';
import { describe, expect, it } from 'vitest';
import { createStore } from 'zustand';
import { temporal } from 'zundo';

import { builderStateCreator } from './builder';

/**
 * Undo-readiness spike (Phase 8 gate): the same state creator wraps in zundo's
 * `temporal` with no refactor. `updateField` only ever `set({ definition })` with
 * a fresh object, so history capture + undo/redo work.
 */
describe('builder store is undo-ready (zundo spike)', () => {
  it('undo/redo an updateField edit via a temporal store', () => {
    const store = createStore(
      temporal(builderStateCreator, { partialize: (s) => ({ definition: s.definition }) }),
    );

    const def = buildStoreDefinition(validStoreDefinitionInput(), {
      idFactory: sequentialIdFactory(),
    });
    store.getState().setGenerated({ definition: def, promptVersion: 'store@v1', prompt: 'p' });
    store.getState().updateField(['meta', 'name'], 'Edited');
    expect(store.getState().definition?.meta.name).toBe('Edited');

    store.temporal.getState().undo();
    expect(store.getState().definition?.meta.name).toBe('Maison Oud');

    store.temporal.getState().redo();
    expect(store.getState().definition?.meta.name).toBe('Edited');
  });
});
