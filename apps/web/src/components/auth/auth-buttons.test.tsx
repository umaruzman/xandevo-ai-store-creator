import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

const signIn = vi.fn();
const signOut = vi.fn();
vi.mock('next-auth/react', () => ({
  signIn: (...a: unknown[]) => signIn(...a),
  signOut: (...a: unknown[]) => signOut(...a),
}));

import { SignInButton } from './sign-in-button';
import { SignOutButton } from './sign-out-button';

describe('auth buttons', () => {
  it('SignInButton starts the Google flow with the callback URL', async () => {
    render(<SignInButton callbackUrl="/dashboard" />);
    await userEvent.click(screen.getByRole('button', { name: /continue with google/i }));
    expect(signIn).toHaveBeenCalledWith('google', { redirectTo: '/dashboard' });
  });

  it('SignOutButton signs out back to the landing page', async () => {
    render(<SignOutButton />);
    await userEvent.click(screen.getByRole('button', { name: /sign out/i }));
    expect(signOut).toHaveBeenCalledWith({ redirectTo: '/' });
  });
});
