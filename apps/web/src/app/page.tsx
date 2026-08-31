import { STORE_DEFINITION_SCHEMA_VERSION } from '@xandevo/shared';

import { Button } from '@/components/ui/button';

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col items-start justify-center gap-6 p-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Xandevo</h1>
        <p className="text-muted-foreground">
          AI Store Builder — development foundation (Phase 2). No product features yet.
        </p>
      </div>
      <p className="text-muted-foreground text-sm">
        Store Definition schema version:{' '}
        <code className="bg-muted rounded px-1.5 py-0.5">{STORE_DEFINITION_SCHEMA_VERSION}</code>
      </p>
      <Button disabled>Create a store (coming in Phase 6)</Button>
    </main>
  );
}
