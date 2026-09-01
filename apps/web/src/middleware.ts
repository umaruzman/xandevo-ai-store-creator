import { NextResponse } from 'next/server';

import { auth } from '@/lib/auth';

/** Gate the (dashboard) route group: unauthenticated users go to /sign-in. */
export default auth((req) => {
  if (!req.auth) {
    const signIn = new URL('/sign-in', req.nextUrl.origin);
    signIn.searchParams.set('callbackUrl', req.nextUrl.pathname);
    return NextResponse.redirect(signIn);
  }
  return NextResponse.next();
});

export const config = {
  matcher: ['/dashboard/:path*'],
};
