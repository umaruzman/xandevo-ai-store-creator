import { notFound } from 'next/navigation';

import { StoreEditorLoader } from '@/components/builder/store-editor-loader';
import { ApiError } from '@/lib/api';
import { apiClient } from '@/lib/api-client';

export default async function StorePage({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;

  try {
    const store = await apiClient.getStore(storeId);
    return <StoreEditorLoader store={store} />;
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }
}
