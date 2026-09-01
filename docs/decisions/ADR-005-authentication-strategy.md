# ADR-005 — Authentication Strategy

- **Status:** Accepted (Phase 1; resolved 2026-09-01, option A). **Implemented in Phase 4.**
- **Date:** 2026-08-31

## Implementation (Phase 4)

- Contract in `@xandevo/shared/auth`: `API_JWT_ISSUER` (`xandevo-web`),
  `API_JWT_AUDIENCE` (`xandevo-api`), `API_JWT_ALGORITHM` (`HS256`),
  `API_JWT_TTL_SECONDS` (900), `ApiJwtClaims` — imported by both apps so they can't drift.
- **`apps/web`:** Auth.js (NextAuth v5) Google provider, `session.strategy = 'jwt'`, no DB
  adapter (`lib/auth.ts`). `lib/api-token.ts#mintApiToken` signs the dedicated API JWT with
  `AUTH_JWT_SECRET` (`jose`, server-only). `lib/api.ts#apiFetch` attaches it to server-side
  API calls. `middleware.ts` gates `/dashboard/:path*`.
- **`apps/api`:** `AuthModule` registers a global `APP_GUARD` `JwtAuthGuard` (secure by
  default; `@Public()` opts health out) + `JwtStrategy` (`passport-jwt`, verifies signature
  / `iss` / `aud` / `exp`). `JwtStrategy.validate` calls `UsersService.upsertFromClaims`
  (first-login provisioning keyed by Google `sub`). `@CurrentUser()` exposes the row.
  `UsersController` serves `GET /me`.
- No session revocation list — the 15-minute TTL bounds exposure; the web app re-mints from
  the live Auth.js session.

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
