'use client';

import { useEffect, useId, useState } from 'react';

import { pathKey, type Path } from '@/lib/set-path';
import { readField, useBuilderStore } from '@/lib/store/builder';

interface FieldCodec<T> {
  /** Store value -> input string. */
  format: (value: T) => string;
  /** Input string -> value to commit. */
  parse: (raw: string) => unknown;
}

const stringCodec: FieldCodec<unknown> = {
  format: (v) => String(v ?? ''),
  parse: (raw) => raw,
};

/**
 * Binds one control to `path` in the builder store: local input state that
 * commits valid edits immediately (live preview) and keeps an invalid value
 * on-screen with the store's rejection message.
 */
export function useField<T = unknown>(
  path: Path,
  codec: FieldCodec<T> = stringCodec as FieldCodec<T>,
) {
  const id = useId();
  const storeValue = useBuilderStore((s) => readField(s, path)) as T;
  const updateField = useBuilderStore((s) => s.updateField);
  const error = useBuilderStore((s) => s.editErrors[pathKey(path)]);

  const [draft, setDraft] = useState<string>(() => codec.format(storeValue));

  // Resync when the store value changes for a reason other than this field
  // (reset, undo, another editor). Skip while this field holds a rejected draft.
  useEffect(() => {
    if (!error) setDraft(codec.format(storeValue));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- codec is stable per call site
  }, [storeValue, error]);

  const onChange = (raw: string) => {
    setDraft(raw);
    updateField(path, codec.parse(raw));
  };

  return { id, draft, error, onChange, storeValue };
}
