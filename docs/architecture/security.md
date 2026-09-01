# Security Architecture

Practical rules every implementation phase must follow. Treat all external input — HTTP
bodies, query params, JWT claims, **AI output**, and the user's prompt — as hostile until
validated.

## 1. Authentication  *(implemented — Phase 4)*

- Google OAuth via Auth.js (NextAuth v5) in `apps/web`, `session.strategy = 'jwt'`, no DB
  adapter. Session in an httpOnly, Secure, SameSite=Lax cookie owned by the web app.
- For API calls the web app mints a **dedicated** short-lived JWT (not the session token) —
  `mintApiToken` (`jose`, HS256, `AUTH_JWT_SECRET`, 15 min), claims per
  `@xandevo/shared/auth`. Attached as `Authorization: Bearer` by `apiFetch` (server-only).
- The API's global `JwtAuthGuard` (`APP_GUARD`) verifies signature, `exp`, `iss`
  (`xandevo-web`), `aud` (`xandevo-api`) on every request. Secure by default; only
  `@Public()` routes (health) skip it. No session cookies on the API; CORS stays off (web
  calls the API server-side).
- Provisioning: `JwtStrategy.validate` → `UsersService.upsertFromClaims`, keyed by Google
  `sub` (stable); email / name / avatar re-synced each request.
- `AUTH_JWT_SECRET` is shared by both apps and must be ≥16 chars; both refuse to
  start/mint otherwise.
- Logout: web clears the session cookie; the 15-min TTL bounds API access, so no server
  revocation list for MVP.

## 2. Authorization & tenant isolation

- Every store-scoped query includes `where: { userId }`. No exceptions.
- `StoreOwnerGuard` loads the store and 404s (not 403) if `store.userId !== currentUser.id`
  — avoids confirming existence of other users' resources.
- Services re-check ownership even behind the guard (defense in depth).
- No admin/impersonation endpoints in MVP.

## 3. Input validation

- Global `ValidationPipe`: `whitelist`, `forbidNonWhitelisted`, `transform`.
- DTOs declare every field with `class-validator` constraints (type, length, range, enum,
  pattern). No untyped `body` access.
- Env validated by schema at boot; missing/invalid → process exits.
- Payload limits: global 256 KB; `/generate` prompt ≤ 2 KB; `/stores` definition ≤ 128 KB.

## 4. AI-specific threats

| Threat | Mitigation |
|---|---|
| Prompt injection via user request | Cap length, strip HTML, wrap in delimiters, system prompt states in-request text is content not instructions, no tools/side-effects exposed to the model. |
| Malicious/unsafe generated content | Full pipeline: Zod schema → business validation → sanitization (strip tags/scripts/control chars) → normalization. |
| Script/HTML injection (XSS) | Renderer renders text as text only. No `dangerouslySetInnerHTML` on any generated field. Constrained markdown subset (if any) rendered via a safe allowlist renderer. |
| Arbitrary code execution | AI never emits code; no `eval`, no `new Function`, no dynamic import of generated strings, no runtime component compilation. |
| Malicious URLs (`javascript:`, `data:`, tracking) | All url-bearing fields rejected unless host is on an allowlist; targets are structured, not raw hrefs. |
| Oversized content / cost abuse | Length caps per field; token budget per request; rate limiting. |
| SSRF via image URLs | MVP uses placeholder images only; `url` image kind disabled until an upload pipeline with host allowlist + fetch proxy exists. |

## 5. Web (XSS / CSRF / headers)  *(implemented — Phase 10)*

- React auto-escaping; renderer never uses `dangerouslySetInnerHTML` on generated content.
- **CSP** — nonce-based, set per request in `apps/web/src/middleware.ts` (`lib/csp.ts`):
  prod `script-src 'self' 'nonce-…' 'strict-dynamic'` (no `unsafe-eval`); dev relaxes for
  HMR. `style-src 'self' 'unsafe-inline'` is deliberate — the storefront renderer applies
  the validated theme through inline `style={}` (tokens only, never script).
  `img-src 'self' data: https:`, `connect-src 'self'`, `frame-ancestors 'none'`,
  `object-src 'none'`, `base-uri`/`form-action 'self'`.
- **Static headers** via `next.config.ts`: `X-Content-Type-Options: nosniff`,
  `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`,
  `Permissions-Policy` locking camera/mic/geo/topics. `poweredByHeader: false`.
- CSRF: the API is token-based (no ambient cookie auth). The web BFF route handlers under
  `app/api/*` are same-origin only; Auth.js handles CSRF for the OAuth flow.
- Cookies: httpOnly, Secure, SameSite=Lax (Auth.js session).
- `next/image` deferred until real media upload; placeholder previews are inline SVG data
  URIs on `<img alt>`.

## 6. API abuse & rate limiting  *(implemented — Phase 5/9/10)*

- `@nestjs/throttler` (global 240/min/user, keyed by `req.user.id` via `UserThrottlerGuard`):
  `POST /generate` 10/min, `POST /stores` 30/min, `PATCH /stores/:id` 60/min.
- **Helmet** on the API (`bootstrap.ts`) — minimal CSP (`default-src 'none'`),
  `X-Powered-By` stripped, `Cross-Origin-Resource-Policy: same-site`.
- **CORS is OFF** — the browser never calls the API directly (all traffic is server-side:
  RSC / Server Actions / BFF route handlers), so no cross-origin allowance is needed.
- `AuditInterceptor` (`APP_INTERCEPTOR`) logs one structured line per mutating request
  (`requestId`, `userId`, method, route, status, latency) — never bodies/params.
- Per-user generation quotas remain a hook for future billing.

## 7. Secret management

- Secrets only in server env / secret manager. Never in the repo, never in `NEXT_PUBLIC_*`,
  never in client bundles, never in API responses or logs.
- `.env.example` documents names with placeholder values; real `.env*` is gitignored.
- Separate keys per environment. Rotation documented in the ops runbook (Phase 12).

## 8. Database security

- Least-privilege DB user for the app (CRUD, no DDL in prod; migrations run by a separate
  role/CI step).
- Parameterized queries only (Prisma). No raw string-built SQL with user input.
- TLS to the database. Backups encrypted. No PII beyond email + Google `sub` + display name.
- `ON DELETE CASCADE` from `User` → `Store` so account deletion removes owned data.

## 9. Logging & sensitive data

- Structured logs; include `requestId`, `userId`, route, status, latency.
- Never log: JWTs, secrets, full AI prompts/outputs (debug only, redacted), email in plain
  info logs (use `userId`).
- Error responses to clients: generic message + `requestId`; stack traces server-side only.

## 10. Dependency & supply chain

- Lockfile committed; `pnpm audit` in CI; Dependabot/Renovate for updates.
- Pin the AI provider SDK versions; review changelogs before bumping.

## 11. Checklist for every PR touching a boundary

Mirrored in `.github/PULL_REQUEST_TEMPLATE.md`.

- [ ] New input has a DTO with full `class-validator` constraints, or is validated by a Zod
      schema. Client-supplied `definition` re-runs `validateStoreDefinition`.
- [ ] Every new store/aggregate query is `userId`-scoped; `/:id` routes use `StoreOwnerGuard`
      (404, not 403) and the service re-checks.
- [ ] No generated / user content rendered as HTML (`dangerouslySetInnerHTML`, `eval`).
- [ ] No secret in `NEXT_PUBLIC_*`, client bundles, API responses, or logs. New URL fields
      are host-allowlisted or structured link targets — never raw hrefs.
- [ ] Rate limit (`@Throttle`) set for a new mutating / expensive route; body-size fits the
      256 KB limit.
- [ ] New browser → server call goes through a Server Action or a same-origin BFF route
      handler (never a direct cross-origin call to the API; CORS stays off).
- [ ] New client-executed script source is covered by the CSP (`lib/csp.ts`); no new
      `unsafe-*` without justification.
- [ ] Mutating route emits an audit line; no bodies/params/PII beyond `userId` logged.
