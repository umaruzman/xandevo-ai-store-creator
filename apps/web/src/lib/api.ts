import 'server-only';

import { auth } from './auth';
import { mintApiToken } from './api-token';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Server-side fetch to the Nest API with the current user's short-lived JWT
 * attached. Phase 6 grows this into a typed client; for now it is the minimal
 * bridge the dashboard uses to prove the auth loop.
 */
export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const session = await auth();
  const headers = new Headers(init.headers);

  if (session?.user) {
    const token = await mintApiToken({
      sub: session.user.id,
      email: session.user.email ?? '',
      name: session.user.name ?? undefined,
      picture: session.user.image ?? undefined,
    });
    headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(`${API_URL}${path}`, { ...init, headers, cache: 'no-store' });
  if (!res.ok) {
    throw new ApiError(res.status, `API ${init.method ?? 'GET'} ${path} failed (${res.status})`);
  }
  return (await res.json()) as T;
}
