import type { StoreDefinition } from '@xandevo/shared';
import { create } from 'zustand';

import { hashValue } from '@/lib/hash';

export type GenerationStatus = 'idle' | 'pending' | 'success' | 'error';

export interface GeneratedPayload {
  definition: StoreDefinition;
  promptVersion: string;
}

/** Server-store shape hydrated in Phase 9. */
export interface SavedStore {
  id: string;
  definition: StoreDefinition;
  promptVersion: string;
}

interface BuilderState {
  storeId: string | null;
  promptVersion: string | null;
  /** The single working copy of the editable definition (ADR-007). */
  definition: StoreDefinition | null;
  /** Hash of the last persisted definition; `null` = never saved. */
  savedHash: string | null;
  generation: { status: GenerationStatus; error?: string };

  startGeneration: () => void;
  setGenerated: (payload: GeneratedPayload) => void;
  setGenerationError: (message: string) => void;
  /** Phase 9 — hydrate an existing store for editing. */
  loadFromServer: (store: SavedStore) => void;
  /** Phase 9 — mark the current definition as persisted. */
  markSaved: (store: SavedStore) => void;
  reset: () => void;
}

const initial = {
  storeId: null,
  promptVersion: null,
  definition: null,
  savedHash: null,
  generation: { status: 'idle' as GenerationStatus },
};

export const useBuilderStore = create<BuilderState>((set) => ({
  ...initial,

  startGeneration: () => set({ generation: { status: 'pending' } }),

  setGenerated: ({ definition, promptVersion }) =>
    set({
      definition,
      promptVersion,
      storeId: null,
      savedHash: null, // freshly generated — never saved
      generation: { status: 'success' },
    }),

  setGenerationError: (message) => set({ generation: { status: 'error', error: message } }),

  loadFromServer: (store) =>
    set({
      storeId: store.id,
      definition: store.definition,
      promptVersion: store.promptVersion,
      savedHash: hashValue(store.definition),
      generation: { status: 'idle' },
    }),

  markSaved: (store) =>
    set({
      storeId: store.id,
      definition: store.definition,
      savedHash: hashValue(store.definition),
    }),

  reset: () => set({ ...initial }),
}));

/** Derived, never stored: has the working definition diverged from the saved one? */
export function selectIsDirty(state: BuilderState): boolean {
  if (!state.definition) return false;
  return hashValue(state.definition) !== state.savedHash;
}

export function selectHasDefinition(state: BuilderState): boolean {
  return state.definition !== null;
}
