'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import { GenerationStatus } from './generation-status';

interface PromptFormProps {
  formAction: (formData: FormData) => void;
  isPending: boolean;
  error: string | null;
  onSubmitStart?: () => void;
}

export function PromptForm({ formAction, isPending, error, onSubmitStart }: PromptFormProps) {
  return (
    <form action={formAction} onSubmit={onSubmitStart} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="prompt" className="text-sm font-medium">
          Describe your store
        </label>
        <textarea
          id="prompt"
          name="prompt"
          required
          minLength={10}
          maxLength={1000}
          rows={4}
          disabled={isPending}
          aria-describedby="prompt-hint"
          aria-invalid={error ? true : undefined}
          placeholder="e.g. A luxury perfume store for UAE customers"
          className={cn(
            'border-input bg-background w-full rounded-md border p-3 text-sm',
            'focus-visible:ring-ring/50 outline-none focus-visible:ring-[3px]',
            'disabled:cursor-not-allowed disabled:opacity-60',
          )}
        />
        <p id="prompt-hint" className="text-muted-foreground text-xs">
          10–1000 characters. Mention the niche, the audience, and the country.
        </p>
      </div>

      {error ? (
        <p role="alert" className="text-destructive text-sm">
          {error}
        </p>
      ) : null}

      {isPending ? <GenerationStatus /> : null}

      <Button type="submit" disabled={isPending}>
        {isPending ? 'Generating…' : 'Generate store'}
      </Button>
    </form>
  );
}
