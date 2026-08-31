---
name: architecture
description: Xandevo project-wide architectural rules, layering, boundaries, and phase discipline. Load at the start of any non-trivial task or when a change touches module/app boundaries, the Store Definition, or cross-cutting concerns.
---

# Xandevo — Architecture Rules

Read `CLAUDE.md` and the relevant `docs/` file before coding. This skill is the short list.

## Phase discipline

- Check the current phase in `CLAUDE.md` and the "must NOT implement" list in
  `docs/development/roadmap.md` before writing code. Do not build ahead of the phase.
- Phase 1 is planning only — no product code.

## Layering (both apps)

```
Presentation → Application → Domain ← Infrastructure
```

- Domain = Store Definition Zod schema + pure validators/normalizers/sanitizers
  (`packages/shared` + `apps/api/src/**/domain`). Depends on nothing.
- Infrastructure implements interfaces the application owns: `AiProvider`, repositories,
  config, JWT verification.
- No upward dependencies. No framework imports in `packages/shared`.

## Hard rules

1. TypeScript `strict`, no `any` without a justification comment.
2. Validate every boundary: DTO + `class-validator` for HTTP; Zod + business + sanitize +
   normalize for AI output. AI output is untrusted.
3. AI produces **data** conforming to the Store Definition schema — never code/HTML/CSS/URLs.
4. Application code depends on `AiProvider`, never a vendor SDK. Vendor SDKs only under
   `apps/api/src/ai/providers/`.
5. Thin controllers; logic in services / pure domain functions. No logic in React components
   either — extract to hooks/helpers.
6. Every store query scoped by authenticated `userId`. Non-owned resource → 404.
7. One working copy of the editable definition: the Zustand builder store.
8. Cross-app types live in `packages/shared`; never redefine locally.
9. Update the matching `docs/` file + ADR in the same PR as a behavior/design change.
10. Small atomic Conventional Commits.

## When making an architectural decision

- If it's genuinely consequential, add or update an ADR in `docs/decisions/`.
- If it conflicts with an existing ADR or `CLAUDE.md` rule, stop and raise it with the user.
- New Store Definition capability → follow the extension checklist in
  `docs/architecture/store-definition.md` §5.
