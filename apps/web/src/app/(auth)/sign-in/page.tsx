import Link from 'next/link';
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
    <main className="relative flex min-h-dvh flex-col items-center justify-center px-4 py-12">
      <Link
        href="/"
        className="text-muted-foreground hover:text-foreground absolute left-5 top-5 text-sm transition-colors"
      >
        ← Xandevo
      </Link>

      <div className="w-full max-w-sm">
        <div className="bg-card rounded-xl border p-8 shadow-sm">
          <p className="text-muted-foreground text-xs font-medium uppercase tracking-[0.14em]">
            Xandevo
          </p>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight">Sign in to your workspace</h1>
          <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
            Describe a store in a sentence and get a real, editable storefront. Your stores are
            saved to your account.
          </p>

          <div className="mt-7">
            <SignInButton callbackUrl={callbackUrl ?? '/dashboard'} />
          </div>

          <p className="text-muted-foreground mt-6 text-xs leading-relaxed">
            By continuing you agree to the Terms of Service and acknowledge the Privacy Policy.
          </p>
        </div>

        <p className="text-muted-foreground mt-6 text-center text-xs">
          Google is the only sign-in method. We only read your name, email and avatar.
        </p>
      </div>
    </main>
  );
}
