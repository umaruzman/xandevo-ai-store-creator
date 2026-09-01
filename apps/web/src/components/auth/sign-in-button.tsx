'use client';

import { signIn } from 'next-auth/react';

import { Button } from '@/components/ui/button';

export function SignInButton({ callbackUrl = '/dashboard' }: { callbackUrl?: string }) {
  return (
    <Button onClick={() => void signIn('google', { redirectTo: callbackUrl })}>
      Continue with Google
    </Button>
  );
}
