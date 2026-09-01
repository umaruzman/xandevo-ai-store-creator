'use client';

import { cn } from '@/lib/utils';
import type { Path } from '@/lib/set-path';

import { FieldRow } from './field-row';
import { useField } from './use-field';

const isHex = (v: string) => /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(v);

export function ColorField({ label, path }: { label: string; path: Path }) {
  const { id, draft, error, onChange } = useField<string>(path, {
    format: (v) => String(v ?? ''),
    parse: (raw) => raw.trim(),
  });

  return (
    <FieldRow label={label} htmlFor={id} error={error}>
      <div className="flex items-center gap-2">
        <input
          type="color"
          aria-label={`${label} colour picker`}
          value={isHex(draft) ? draft : '#000000'}
          onChange={(e) => onChange(e.target.value)}
          className="size-8 shrink-0 cursor-pointer rounded border"
        />
        <input
          id={id}
          type="text"
          value={draft}
          aria-invalid={error ? true : undefined}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            'bg-background w-full rounded-md border p-2 font-mono text-sm',
            'focus-visible:ring-ring/50 outline-none focus-visible:ring-[3px]',
            error && 'border-destructive',
          )}
        />
      </div>
    </FieldRow>
  );
}
