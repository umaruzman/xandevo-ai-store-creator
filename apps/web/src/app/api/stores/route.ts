import type { NextRequest } from 'next/server';

import { apiClient } from '@/lib/api-client';
import { proxy } from '@/lib/proxy-response';

export function GET(req: NextRequest) {
  return proxy(() => apiClient.listStores(req.nextUrl.search));
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  return proxy(() => apiClient.createStore(body), 201);
}
