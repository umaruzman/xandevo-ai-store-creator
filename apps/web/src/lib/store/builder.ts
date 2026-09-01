import { storeDefinitionSchema, type StoreDefinition } from '@xandevo/shared';
import { create, type StateCreator } from 'zustand';

import { hashValue } from '@/lib/hash';
import { getAtPath, type Path, pathKey, setAtPath } from '@/lib/set-path';

export type GenerationStatus = 'idle' | 'pending' | 'success' | 'error';

export interface GeneratedPayload {
  definition: StoreDefinition;
  promptVersion: string;
  prompt: string;
}

export interface SavedStore {
  id: string;
  definition: StoreDefinition;
  promptVersion: string;
}

export interface FieldResult {
  ok: boolean;
  error?: string;
}

interface BuilderState {
  storeId: string | null;
  promptVersion: string | null;
  /** The original NL prompt — needed by `POST /stores` when first saving. */
  promptText: string | null;
  /** The single working copy of the editable definition (ADR-007). */
  definition: StoreDefinition | null;
  /** Hash of the last persisted definition; `null` = never saved. */
  savedHash: string | null;
  generation: { status: GenerationStatus; error?: string };
  /** Per-field validation errors from rejected edits, keyed by `pathKey(path)`. */
  editErrors: Record<string, string>;

  startGeneration: () => void;
  setGenerated: (payload: GeneratedPayload) => void;
  setGenerationError: (message: string) => void;
  loadFromServer: (store: SavedStore) => void;
  markSaved: (store: SavedStore) => void;
  reset: () => void;

  /**
   * Validated, immutable edit of one field. Sets `value` at `path`, re-validates
   * the whole definition against the Zod schema, and commits ONLY if it passes —
   * always via `set({ definition })` with a structurally-shared new object, so a
   * history middleware (zundo) wraps this with no refactor.
   */
  updateField: (path: Path, value: unknown) => FieldResult;
  /** Move a section within its page and renumber `order`. */
  moveSection: (pageId: string, sectionId: string, direction: 'up' | 'down') => FieldResult;
}

const initial = {
  storeId: null,
  promptVersion: null,
  promptText: null,
  definition: null,
  savedHash: null,
  generation: { status: 'idle' as GenerationStatus },
  editErrors: {} as Record<string, string>,
};

export const builderStateCreator: StateCreator<BuilderState> = (set, get) => ({
  ...initial,

  startGeneration: () => set({ generation: { status: 'pending' } }),

  setGenerated: ({ definition, promptVersion, prompt }) =>
    set({
      definition,
      promptVersion,
      promptText: prompt,
      storeId: null,
      // Baseline for dirty tracking = the generated definition; an edit makes it dirty.
      savedHash: hashValue(definition),
      editErrors: {},
      generation: { status: 'success' },
    }),

  setGenerationError: (message) => set({ generation: { status: 'error', error: message } }),

  loadFromServer: (store) =>
    set({
      storeId: store.id,
      definition: store.definition,
      promptVersion: store.promptVersion,
      savedHash: hashValue(store.definition),
      editErrors: {},
      generation: { status: 'idle' },
    }),

  markSaved: (store) =>
    set({
      storeId: store.id,
      definition: store.definition,
      savedHash: hashValue(store.definition),
    }),

  reset: () => set({ ...initial, editErrors: {} }),

  updateField: (path, value) => {
    const current = get().definition;
    if (!current) return { ok: false, error: 'no store loaded' };

    const candidate = setAtPath(current, path, value);
    const parsed = storeDefinitionSchema.safeParse(candidate);
    const key = pathKey(path);

    if (!parsed.success) {
      const issue =
        parsed.error.issues.find((i) => pathKey(i.path as Path).startsWith(key)) ??
        parsed.error.issues[0];
      const message = issue?.message ?? 'invalid value';
      set((s) => ({ editErrors: { ...s.editErrors, [key]: message } }));
      return { ok: false, error: message };
    }

    set((s) => {
      const { [key]: _removed, ...rest } = s.editErrors;
      return { definition: candidate, editErrors: rest };
    });
    return { ok: true };
  },

  moveSection: (pageId, sectionId, direction) => {
    const def = get().definition;
    if (!def) return { ok: false, error: 'no store loaded' };
    const pageIndex = def.pages.findIndex((p) => p.id === pageId);
    if (pageIndex < 0) return { ok: false, error: 'page not found' };

    const sections = [...def.pages[pageIndex]!.sections].sort((a, b) => a.order - b.order);
    const from = sections.findIndex((s) => s.id === sectionId);
    const to = direction === 'up' ? from - 1 : from + 1;
    if (from < 0 || to < 0 || to >= sections.length) return { ok: false, error: 'cannot move' };

    [sections[from], sections[to]] = [sections[to]!, sections[from]!];
    const renumbered = sections.map((s, i) => (s.order === i ? s : { ...s, order: i }));
    return get().updateField(['pages', pageIndex, 'sections'], renumbered);
  },
});

export const useBuilderStore = create<BuilderState>()(builderStateCreator);

/** Derived, never stored: has the working definition diverged from the saved one? */
export function selectIsDirty(state: BuilderState): boolean {
  if (!state.definition) return false;
  return hashValue(state.definition) !== state.savedHash;
}

export function selectHasDefinition(state: BuilderState): boolean {
  return state.definition !== null;
}

/** Read a value at `path` from the current working definition (for field components). */
export function readField(state: BuilderState, path: Path): unknown {
  return state.definition ? getAtPath(state.definition, path) : undefined;
}
