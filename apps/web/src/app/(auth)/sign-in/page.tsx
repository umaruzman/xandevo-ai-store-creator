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
    <div className="lp grid min-h-dvh lg:grid-cols-[1.05fr_1fr]">
      <aside className="hidden flex-col justify-between bg-[color:var(--lp-forest)] p-12 text-[color:var(--lp-surface)] lg:flex">
        <Link href="/" className="lp-display text-xl">
          Xandevo
        </Link>
        <div>
          <p className="lp-display max-w-sm text-4xl leading-tight">
            One sentence in. A real storefront out.
          </p>
          <p className="mt-4 max-w-sm text-sm opacity-70">
            Generate a themed store with priced products and its own pages, then edit every word
            against a live preview.
          </p>
        </div>
        <p className="text-xs opacity-50">AI Store Builder by Umar Uzman</p>
      </aside>

      <main className="flex flex-col items-center justify-center px-5 py-12">
        <div className="w-full max-w-sm">
          <Link
            href="/"
            className="text-sm text-[color:var(--lp-ink-soft)] transition-colors hover:text-[color:var(--lp-ink)] lg:hidden"
          >
            ← Xandevo
          </Link>

          <h1 className="lp-display mt-6 text-3xl text-[color:var(--lp-ink)] lg:mt-0">
            Sign in to your workspace
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-[color:var(--lp-ink-soft)]">
            Your stores are saved to your account. Continue with Google to pick up where you left
            off.
          </p>

          <div className="mt-8">
            <SignInButton callbackUrl={callbackUrl ?? '/dashboard'} />
          </div>

          <p className="mt-6 text-xs leading-relaxed text-[color:var(--lp-ink-soft)]">
            We only read your name, email and avatar. By continuing you agree to the Terms of
            Service and Privacy Policy.
          </p>
        </div>
      </main>
    </div>
  );
}
