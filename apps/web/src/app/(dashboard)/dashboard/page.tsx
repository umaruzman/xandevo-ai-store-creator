import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { ApiError } from '@/lib/api';
import { apiClient } from '@/lib/api-client';

export default async function DashboardPage() {
  let stores: Awaited<ReturnType<typeof apiClient.listStores>>['items'] = [];
  let error: string | null = null;
  try {
    stores = (await apiClient.listStores()).items;
  } catch (err) {
    error = err instanceof ApiError ? `API responded ${err.status}` : 'Could not reach the API';
  }

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Your stores</h1>
        <Button asChild>
          <Link href="/stores/new">Create a store</Link>
        </Button>
      </div>

      {error ? (
        <p className="text-destructive text-sm">Could not load your stores: {error}</p>
      ) : stores.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center">
          <p className="text-muted-foreground text-sm">No stores yet.</p>
          <Button asChild variant="outline" className="mt-4">
            <Link href="/stores/new">Generate your first store</Link>
          </Button>
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {stores.map((s) => (
            <li key={s.id}>
              <Link
                href={`/stores/${s.id}`}
                className="hover:bg-muted/40 block rounded-lg border p-4 transition-colors"
              >
                <p className="font-medium">{s.name}</p>
                <p className="text-muted-foreground text-xs">
                  {s.status} · updated {new Date(s.updatedAt).toLocaleDateString()}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
