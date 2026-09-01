'use client';

import { cn } from '@/lib/utils';
import type { Path } from '@/lib/set-path';

import { FieldRow } from './field-row';
import { useField } from './use-field';

export function TextField({
  label,
  path,
  multiline,
  hint,
}: {
  label: string;
  path: Path;
  multiline?: boolean;
  hint?: string;
}) {
  const { id, draft, error, onChange } = useField<string>(path);
  const common = cn(
    'w-full rounded-md border bg-background p-2 text-sm',
    'focus-visible:ring-ring/50 outline-none focus-visible:ring-[3px]',
    error && 'border-destructive',
  );

  return (
    <FieldRow label={label} htmlFor={id} error={error} hint={hint}>
      {multiline ? (
        <textarea
          id={id}
          rows={3}
          value={draft}
          aria-invalid={error ? true : undefined}
          onChange={(e) => onChange(e.target.value)}
          className={common}
        />
      ) : (
        <input
          id={id}
          type="text"
          value={draft}
          aria-invalid={error ? true : undefined}
          onChange={(e) => onChange(e.target.value)}
          className={common}
        />
      )}
    </FieldRow>
  );
}
