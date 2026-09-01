import 'server-only';

import type {
  CreateStoreRequest,
  GenerateStoreResponse,
  MeResponse,
  StoreListResponse,
  StoreResponse,
  UpdateStoreRequest,
} from '@xandevo/shared';

import { apiFetch } from './api';

/**
 * Typed server-side calls to the Nest API. Consumed from Server Components,
 * Server Actions, and the BFF route handlers under `app/api/*` (all depend on
 * the server-only `apiFetch`, which mints the short-lived API JWT).
 */
export const apiClient = {
  me: () => apiFetch<MeResponse>('/me'),

  generateStore: (prompt: string) =>
    apiFetch<GenerateStoreResponse>('/generate', {
      method: 'POST',
      body: JSON.stringify({ prompt }),
    }),

  listStores: (query = '') => apiFetch<StoreListResponse>(`/stores${query}`),

  getStore: (id: string) => apiFetch<StoreResponse>(`/stores/${id}`),

  createStore: (body: CreateStoreRequest) =>
    apiFetch<StoreResponse>('/stores', { method: 'POST', body: JSON.stringify(body) }),

  updateStore: (id: string, body: UpdateStoreRequest) =>
    apiFetch<StoreResponse>(`/stores/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),

  deleteStore: (id: string) => apiFetch<null>(`/stores/${id}`, { method: 'DELETE' }),
};
