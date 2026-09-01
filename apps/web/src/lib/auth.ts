import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';

/**
 * Auth.js (NextAuth v5) — Google OAuth, JWT session strategy (no DB adapter).
 * ADR-005: the browser session lives here; API calls use a separate short-lived
 * JWT minted from this session (see `lib/api-token.ts`).
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: { strategy: 'jwt', maxAge: 60 * 60 * 24 * 7 },
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  ],
  callbacks: {
    // Persist the Google identity we need to mint the API token.
    jwt({ token, profile }) {
      if (profile) {
        token.sub = profile.sub ?? token.sub;
        token.email = profile.email ?? token.email;
        token.name = profile.name ?? token.name;
        token.picture = (profile.picture as string | undefined) ?? token.picture;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? '';
      }
      return session;
    },
  },
  pages: { signIn: '/sign-in' },
});
