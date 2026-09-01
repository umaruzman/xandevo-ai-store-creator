'use client';

import type { Path } from '@/lib/set-path';
import { cn } from '@/lib/utils';

import { FieldRow } from './field-row';
import { useField } from './use-field';

/** Price editor: shows major units, commits integer minor units. */
export function PriceField({ label, path }: { label: string; path: Path }) {
  const { id, draft, error, onChange } = useField<number>(path, {
    format: (minor) => (Number.isFinite(minor) ? String(minor / 100) : ''),
    parse: (raw) => {
      const major = Number(raw);
      return raw.trim() === '' || !Number.isFinite(major) ? NaN : Math.round(major * 100);
    },
  });

  return (
    <FieldRow label={label} htmlFor={id} error={error}>
      <input
        id={id}
        type="number"
        min={0}
        step="0.01"
        value={draft}
        aria-invalid={error ? true : undefined}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          'bg-background w-full rounded-md border p-2 text-sm',
          'focus-visible:ring-ring/50 outline-none focus-visible:ring-[3px]',
          error && 'border-destructive',
        )}
      />
    </FieldRow>
  );
}
