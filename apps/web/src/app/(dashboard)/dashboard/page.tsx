import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { ApiError } from '@/lib/api';
import { apiClient } from '@/lib/api-client';

export default async function DashboardPage() {
  let email: string | null = null;
  let error: string | null = null;
  try {
    email = (await apiClient.me()).email;
  } catch (err) {
    error = err instanceof ApiError ? `API responded ${err.status}` : 'Could not reach the API';
  }

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Your stores</h1>
          {email ? (
            <p className="text-muted-foreground text-sm">Signed in as {email}</p>
          ) : (
            <p className="text-destructive text-sm">Auth loop check failed: {error}</p>
          )}
        </div>
        <Button asChild>
          <Link href="/stores/new">Create a store</Link>
        </Button>
      </div>

      <div className="rounded-lg border border-dashed p-10 text-center">
        <p className="text-muted-foreground text-sm">
          No saved stores yet. Generated stores can be saved from Phase 9 onward.
        </p>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/stores/new">Generate your first store</Link>
        </Button>
      </div>
    </div>
  );
}
