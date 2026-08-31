# Security Architecture

Practical rules every implementation phase must follow. Treat all external input — HTTP
bodies, query params, JWT claims, **AI output**, and the user's prompt — as hostile until
validated.

## 1. Authentication

- Google OAuth via Auth.js in `apps/web`. Session stored in an httpOnly, Secure, SameSite=Lax
  cookie owned by the web app.
- For API calls, the web app presents a short-lived JWT (see ADR-005) in
  `Authorization: Bearer`. The API verifies signature, `exp`, `iss`, `aud` on every request
  via `JwtAuthGuard`. No session cookies on the API.
- User provisioning: on first successful login, upsert a `User` by Google `sub`. `sub` is the
  stable identity; email may change.
- Logout: web clears the session cookie; JWTs are short-lived (≤15 min) so no server
  revocation list is needed for MVP. Refresh handled by Auth.js session.

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

## 5. Web (XSS / CSRF / headers)

- React auto-escaping; no raw HTML injection of user or AI content.
- `next/image` with `alt` required; remote patterns restricted to allowlisted hosts.
- Content Security Policy (Phase 10): restrict `script-src`, `style-src`, `img-src`,
  `connect-src` to self + known hosts.
- CSRF: API is token-based (no ambient cookie auth) so classic CSRF does not apply to it.
  Auth.js handles its own CSRF for the OAuth flow.
- Cookies: httpOnly, Secure, SameSite=Lax.

## 6. API abuse & rate limiting

- `@nestjs/throttler`: `/generate` ~10/min/user; mutations ~60/min/user; reads ~240/min/user.
- Per-user quotas on generations (config-driven) — hook for future billing.
- Helmet for security headers on the API. CORS: exact web origin only, `Authorization`
  header allowed, credentials off.

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

- [ ] New input has a DTO with full constraints, or a Zod schema.
- [ ] New store query is `userId`-scoped.
- [ ] No generated content rendered as HTML.
- [ ] No secret added to client-visible config.
- [ ] New url field is host-allowlisted or structured.
- [ ] Rate limit considered for new mutating/expensive route.
