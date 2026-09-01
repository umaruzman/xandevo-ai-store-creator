'use client';

import type { StoreResponse } from '@xandevo/shared';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { useBuilderStore } from '@/lib/store/builder';

import { StoreEditor } from './store-editor';

/** Hydrates the builder store from a server-loaded store, then renders the editor. */
export function StoreEditorLoader({ store }: { store: StoreResponse }) {
  const loadFromServer = useBuilderStore((s) => s.loadFromServer);
  const reset = useBuilderStore((s) => s.reset);
  const currentId = useBuilderStore((s) => s.storeId);
  const router = useRouter();

  useEffect(() => {
    if (currentId !== store.id) {
      loadFromServer({
        id: store.id,
        definition: store.definition,
        promptVersion: store.promptVersion,
      });
    }
  }, [store, currentId, loadFromServer]);

  if (currentId !== store.id) return null;
  return (
    <StoreEditor
      onStartOver={() => {
        reset();
        router.push('/dashboard');
      }}
    />
  );
}
