'use client';

import type { Path } from '@/lib/set-path';
import { cn } from '@/lib/utils';

import { FieldRow } from './field-row';
import { useField } from './use-field';

export function SelectField({
  label,
  path,
  options,
}: {
  label: string;
  path: Path;
  options: readonly string[];
}) {
  const { id, draft, error, onChange } = useField<string>(path);

  return (
    <FieldRow label={label} htmlFor={id} error={error}>
      <select
        id={id}
        value={draft}
        aria-invalid={error ? true : undefined}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          'bg-background w-full rounded-md border p-2 text-sm capitalize',
          'focus-visible:ring-ring/50 outline-none focus-visible:ring-[3px]',
          error && 'border-destructive',
        )}
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </FieldRow>
  );
}
