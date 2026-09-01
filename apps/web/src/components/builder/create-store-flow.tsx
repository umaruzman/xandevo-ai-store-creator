'use client';

import { useActionState, useEffect } from 'react';

import { generateStoreAction } from '@/app/(dashboard)/stores/new/actions';
import { selectHasDefinition, useBuilderStore } from '@/lib/store/builder';

import { PromptForm } from './prompt-form';
import { StorePreview } from './store-preview';

/**
 * Owns the create-store flow: prompt form -> Server Action -> builder store ->
 * generated summary. Single route, two states — no navigation, no persistence
 * (renderer/editor/save land in Phases 7–9).
 */
export function CreateStoreFlow() {
  const [state, formAction, isPending] = useActionState(generateStoreAction, null);

  const startGeneration = useBuilderStore((s) => s.startGeneration);
  const setGenerated = useBuilderStore((s) => s.setGenerated);
  const setGenerationError = useBuilderStore((s) => s.setGenerationError);
  const reset = useBuilderStore((s) => s.reset);
  const hasDefinition = useBuilderStore(selectHasDefinition);

  useEffect(() => {
    if (!state) return;
    if (state.ok) setGenerated(state.data);
    else setGenerationError(state.error);
  }, [state, setGenerated, setGenerationError]);

  if (hasDefinition) return <StorePreview onStartOver={reset} />;

  return (
    <PromptForm
      formAction={formAction}
      isPending={isPending}
      error={state && !state.ok ? state.error : null}
      onSubmitStart={startGeneration}
    />
  );
}
