import 'server-only';

import { mintApiToken } from './api-token';
import { auth } from './auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly requestId?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Server-side fetch to the Nest API with the current user's short-lived JWT
 * attached. Parses the standard error envelope. Phase 6 keeps this minimal;
 * Phase 9 grows a fuller typed client.
 */
export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const session = await auth();
  const headers = new Headers(init.headers);
  headers.set('content-type', 'application/json');

  if (session?.user) {
    const token = await mintApiToken({
      sub: session.user.id,
      email: session.user.email ?? '',
      name: session.user.name ?? undefined,
      picture: session.user.image ?? undefined,
    });
    headers.set('authorization', `Bearer ${token}`);
  }

  const res = await fetch(`${API_URL}${path}`, { ...init, headers, cache: 'no-store' });
  const text = await res.text();
  const body: unknown = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const envelope = (body as { error?: { code?: string; message?: string; requestId?: string } })
      ?.error;
    throw new ApiError(
      res.status,
      envelope?.code ?? 'ERROR',
      envelope?.message ?? `API ${init.method ?? 'GET'} ${path} failed (${res.status})`,
      envelope?.requestId,
    );
  }
  return body as T;
}
