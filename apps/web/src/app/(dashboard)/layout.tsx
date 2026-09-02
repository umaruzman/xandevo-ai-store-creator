import Link from 'next/link';
import { redirect } from 'next/navigation';

import { SignOutButton } from '@/components/auth/sign-out-button';
import { auth } from '@/lib/auth';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect('/sign-in');

  return (
    <div className="min-h-dvh">
      <a
        href="#main"
        className="bg-background focus:ring-ring sr-only rounded border px-3 py-2 text-sm focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:ring-2"
      >
        Skip to content
      </a>
      <header className="flex items-center justify-between border-b px-6 py-3">
        <Link href="/dashboard" className="font-semibold tracking-tight">
          Xandevo
        </Link>
        <div className="text-muted-foreground flex items-center gap-3 text-sm">
          <span>{session.user.name ?? session.user.email}</span>
          <SignOutButton />
        </div>
      </header>
      <main id="main">{children}</main>
    </div>
  );
}
