# ADR-005 — Authentication Strategy

- **Status:** Accepted (Phase 1; resolved 2026-09-01, option A)
- **Date:** 2026-08-31

## Context

Xandevo needs Google login. The browser session lives in `apps/web`; the authoritative API
is `apps/api`. We must decide who runs the OAuth flow and how the API authenticates requests.

## Decision

- **`apps/web` runs Google OAuth via Auth.js (NextAuth v5).** Session stored in an httpOnly,
  Secure, SameSite=Lax cookie owned by the web app. JWT **session strategy** (no DB session
  tables) for MVP.
- **API authentication via short-lived JWT.** The web app mints (or forwards) a signed,
  short-lived (≤15 min) JWT containing `sub` (Google subject), `email`, `iss`, `aud`, `exp`,
  and presents it as `Authorization: Bearer` on every API call. The API verifies it with a
  `JwtStrategy` (`@nestjs/passport`) — signature, `exp`, `iss`, `aud`.
- **User provisioning:** API upserts a `User` by `googleSub` on first authenticated request
  (or via a dedicated `/auth/sync` call from web after login).
- **Authorization:** `JwtAuthGuard` (authN) + `StoreOwnerGuard` and `userId`-scoped queries
  (authZ). 404 (not 403) on non-owned resources.
- **Logout:** web clears the session cookie; short JWT lifetime bounds API access; no
  server-side revocation list in MVP.
- **Secret sharing:** web and API share a signing secret (`AUTH_JWT_SECRET`) or the API
  verifies against web's JWKS endpoint. Prefer JWKS if using asymmetric keys later.

## Rationale

- Auth.js handles Google OAuth, CSRF for the flow, and session cookies well in Next.js.
- Stateless JWT keeps the API horizontally scalable with no shared session store.
- Clear split: web = identity/session, API = verification + authorization.

## Consequences

- Shared secret / JWKS must be managed across two deploys.
- No instant global logout (mitigated by short token TTL). Add a denylist + refresh rotation
  only if required.
- Token minting location (web route handler vs Auth.js `jwt` callback) to be finalized in
  Phase 4.

## Alternatives considered

- **API owns OAuth (Passport Google strategy), web just redirects:** fewer moving parts for
  token issuance, but worse Next.js DX and web must still hold a session.
- **DB session strategy + session cookie forwarded to API:** stateful, needs session lookup
  on every API call; rejected for scalability.
