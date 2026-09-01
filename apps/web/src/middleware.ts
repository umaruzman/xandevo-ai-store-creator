import { NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { buildCsp } from '@/lib/csp';

const PROTECTED = /^\/(dashboard|stores)(\/|$)/;

/**
 * Per-request: (1) gate the `(dashboard)`/`(stores)` route groups, redirecting
 * unauthenticated users to `/sign-in`; (2) set a nonce-based CSP so Next's
 * scripts carry the nonce.
 */
export default auth((req) => {
  const nonce = crypto.randomUUID().replace(/-/g, '');
  const csp = buildCsp(nonce, process.env.NODE_ENV === 'development');

  if (PROTECTED.test(req.nextUrl.pathname) && !req.auth) {
    const signIn = new URL('/sign-in', req.nextUrl.origin);
    signIn.searchParams.set('callbackUrl', req.nextUrl.pathname);
    return NextResponse.redirect(signIn);
  }

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('content-security-policy', csp);

  const res = NextResponse.next({ request: { headers: requestHeaders } });
  res.headers.set('content-security-policy', csp);
  return res;
});

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
