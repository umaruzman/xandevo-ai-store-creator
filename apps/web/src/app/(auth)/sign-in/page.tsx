import { redirect } from 'next/navigation';

import { SignInButton } from '@/components/auth/sign-in-button';
import { auth } from '@/lib/auth';

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const session = await auth();
  const { callbackUrl } = await searchParams;
  if (session) redirect(callbackUrl ?? '/dashboard');

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col items-center justify-center gap-6 p-8 text-center">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Sign in to Xandevo</h1>
        <p className="text-muted-foreground text-sm">
          Use your Google account to create and manage your stores.
        </p>
      </div>
      <SignInButton callbackUrl={callbackUrl ?? '/dashboard'} />
    </main>
  );
}
