import { NextResponse } from 'next/server';

import { ApiError } from './api';

/** Run a server-side API call and turn its result / `ApiError` into a JSON Response. */
export async function proxy<T>(fn: () => Promise<T>, okStatus = 200): Promise<NextResponse> {
  try {
    const data = await fn();
    return data === null
      ? new NextResponse(null, { status: 204 })
      : NextResponse.json(data, { status: okStatus });
  } catch (err) {
    if (err instanceof ApiError) {
      return NextResponse.json(
        { error: { code: err.code, message: err.message, requestId: err.requestId ?? 'unknown' } },
        { status: err.status },
      );
    }
    return NextResponse.json(
      { error: { code: 'PROXY_ERROR', message: 'Upstream request failed', requestId: 'unknown' } },
      { status: 502 },
    );
  }
}
