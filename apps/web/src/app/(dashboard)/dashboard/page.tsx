import { STORE_DEFINITION_SCHEMA_VERSION } from '@xandevo/shared';

import { ApiError, apiFetch } from '@/lib/api';

interface Me {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  createdAt: string;
}

export default async function DashboardPage() {
  let me: Me | null = null;
  let error: string | null = null;
  try {
    me = await apiFetch<Me>('/me');
  } catch (err) {
    error = err instanceof ApiError ? `API responded ${err.status}` : 'Could not reach the API';
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
      {me ? (
        <p className="text-muted-foreground text-sm">
          Signed in as <span className="text-foreground">{me.email}</span> — provisioned{' '}
          {new Date(me.createdAt).toLocaleDateString()}. Store creation arrives in Phase 6.
        </p>
      ) : (
        <p className="text-destructive text-sm">Auth loop check failed: {error}</p>
      )}
      <p className="text-muted-foreground text-xs">
        Store Definition schema v{STORE_DEFINITION_SCHEMA_VERSION}
      </p>
    </div>
  );
}
