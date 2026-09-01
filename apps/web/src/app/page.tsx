import Link from 'next/link';

import { Button } from '@/components/ui/button';

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col items-start justify-center gap-6 p-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Xandevo</h1>
        <p className="text-muted-foreground">
          Describe a store in plain language and get a live, editable storefront. AI Store Builder
          by Umar Uzman.
        </p>
      </div>
      <Button asChild>
        <Link href="/dashboard">Sign in to get started</Link>
      </Button>
      <p className="text-muted-foreground text-xs">
        Early development — the generation flow arrives in Phase 6.
      </p>
    </main>
  );
}
