import Link from 'next/link';

import { Button } from '@/components/ui/button';

export default function StoreNotFound() {
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <h1 className="text-lg font-semibold">Store not found</h1>
      <p className="text-muted-foreground mt-2 text-sm">
        It may have been deleted, or it belongs to another account.
      </p>
      <Button asChild className="mt-4">
        <Link href="/dashboard">Back to your stores</Link>
      </Button>
    </div>
  );
}
