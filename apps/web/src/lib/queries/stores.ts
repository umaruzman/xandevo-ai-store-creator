'use client';

import type {
  CreateStoreRequest,
  StoreListResponse,
  StoreResponse,
  UpdateStoreRequest,
} from '@xandevo/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export class ClientApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

async function json<T>(input: string, init?: RequestInit): Promise<T> {
  const res = await fetch(input, {
    ...init,
    headers: { 'content-type': 'application/json', ...init?.headers },
  });
  const text = await res.text();
  const body: unknown = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const e = (body as { error?: { code?: string; message?: string } })?.error;
    throw new ClientApiError(
      res.status,
      e?.code ?? 'ERROR',
      e?.message ?? `Request failed (${res.status})`,
    );
  }
  return body as T;
}

export const storeKeys = {
  all: ['stores'] as const,
  detail: (id: string) => ['stores', id] as const,
};

export function useStores() {
  return useQuery({
    queryKey: storeKeys.all,
    queryFn: () => json<StoreListResponse>('/api/stores'),
  });
}

export function useStore(id: string, initialData?: StoreResponse) {
  return useQuery({
    queryKey: storeKeys.detail(id),
    queryFn: () => json<StoreResponse>(`/api/stores/${id}`),
    initialData,
  });
}

export function useCreateStore() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateStoreRequest) =>
      json<StoreResponse>('/api/stores', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: (store) => {
      qc.setQueryData(storeKeys.detail(store.id), store);
      void qc.invalidateQueries({ queryKey: storeKeys.all });
    },
  });
}

export function useUpdateStore(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdateStoreRequest) =>
      json<StoreResponse>(`/api/stores/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
    onSuccess: (store) => {
      qc.setQueryData(storeKeys.detail(id), store);
      void qc.invalidateQueries({ queryKey: storeKeys.all });
    },
  });
}
