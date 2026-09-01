import 'server-only';

import type { GenerateStoreResponse, MeResponse } from '@xandevo/shared';

import { apiFetch } from './api';

/**
 * Typed server-side calls to the Nest API. Consumed from Server Components and
 * Server Actions only (depends on the server-only `apiFetch`).
 */
export const apiClient = {
  me: () => apiFetch<MeResponse>('/me'),

  generateStore: (prompt: string) =>
    apiFetch<GenerateStoreResponse>('/generate', {
      method: 'POST',
      body: JSON.stringify({ prompt }),
    }),

  // listStores / getStore / createStore / updateStore — Phase 9.
};
