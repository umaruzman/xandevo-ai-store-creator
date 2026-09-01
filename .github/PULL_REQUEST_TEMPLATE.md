<!-- Keep PRs small, single-purpose, Conventional Commits. Reference the phase / ADR. -->

## What & why



## How tested



## Checks

- [ ] `pnpm typecheck` / `pnpm lint` / `pnpm test` / `pnpm build` pass
- [ ] Docs updated for the area (architecture / api-contract / data-model / ADR)
- [ ] No new `any`; no new lint disables without justification

## Security (see `docs/architecture/security.md` §11)

- [ ] New input validated by a DTO (`class-validator`) or Zod schema; client `definition`
      re-runs `validateStoreDefinition`
- [ ] New store/aggregate query is `userId`-scoped; `/:id` routes use `StoreOwnerGuard`
- [ ] No generated / user content rendered as HTML; no `eval`
- [ ] No secret in `NEXT_PUBLIC_*` / client bundle / API response / logs; new URL fields
      host-allowlisted or structured
- [ ] `@Throttle` set for new mutating / expensive routes; body ≤ 256 KB
- [ ] Browser → server calls go via Server Action or same-origin BFF route handler (CORS stays off)
- [ ] New client script source covered by the CSP (`lib/csp.ts`); no new `unsafe-*`
- [ ] Mutating routes emit an audit line (no bodies / PII beyond `userId`)
