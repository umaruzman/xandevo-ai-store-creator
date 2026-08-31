# Development Workflow

## 1. Tooling

- **Package manager:** pnpm (workspaces). **Task runner:** Turborepo (`turbo run build lint test typecheck`).
- **Node:** pinned via `.nvmrc` / `engines` (set in Phase 2).
- **Lint/format:** ESLint (typescript-eslint, strict) + Prettier, shared configs from
  `packages/config`. No warnings in CI.
- **Typecheck:** `tsc --noEmit` per package; `strict: true`, `noUncheckedIndexedAccess: true`.

## 2. Branching

- `main` is always green and deployable.
- Work on `type/scope-short-description` branches: `feat/api-stores-module`,
  `fix/web-editor-color-validation`, `docs/adr-005-auth`, `chore/ci-turbo-cache`.
- One phase = one or more branches, each a focused PR. No long-lived divergent branches.

## 3. Commits — Conventional Commits, small & atomic

`<type>(<scope>): <summary>` in imperative mood, ≤72 chars. Body explains *why*.

| type | use |
|---|---|
| `feat` | new user-facing capability |
| `fix` | bug fix |
| `refactor` | behavior-preserving restructure |
| `docs` | documentation only |
| `test` | tests only |
| `chore` | tooling, deps, meta |
| `build` | build system / bundler |
| `ci` | pipeline config |
| `perf` | performance change |

Scopes: `web`, `api`, `shared`, `config`, `db`, `ai`, `auth`, `ci`, `docs`, `repo`.

Rules:
- One logical change per commit. Never mix refactor + feature + docs in one commit.
- Tests land with the code they test (same PR, ideally adjacent commits).
- Generated files (Prisma client, shadcn output) committed in their own `chore` commit.
- Commit messages end with:
  `Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>`

## 4. Pull requests

- Small, single-purpose, references the phase and any ADR.
- PR description: what, why, how tested, docs updated, phase-gate checklist.
- CI must pass: `build`, `lint`, `typecheck`, `test`. No merge on red.
- Squash-merge feature branches; keep the squash message Conventional.

## 5. Phase 1 commit guidance

This phase produces documentation and Claude assets only. Suggested commits (after
`git init`, when the user approves):

1. `chore(repo): initialize repository and gitignore`
2. `docs(repo): add CLAUDE.md and README`
3. `docs(architecture): add system, frontend, backend, ai, store-definition, security, scaling`
4. `docs(database): add conceptual data model and ER diagram`
5. `docs(api): add API contract`
6. `docs(development): add workflow and implementation roadmap`
7. `docs(ai): add prompt engineering guide`
8. `docs(decisions): add ADR-001..007 and open questions`
9. `chore(claude): add project skills`

Do **not** create implementation commits in Phase 1.

## 6. Claude Code workflow

- Start each session by reading `CLAUDE.md`, then the relevant `.claude/skills/*/SKILL.md`,
  then the specific `docs/` file for the area.
- Confirm the current phase and its "must NOT implement" list before writing code.
- When a decision is made, add/adjust an ADR. When behavior changes, update the matching doc
  in the same PR.
- Keep `CLAUDE.md` concise — detail goes to `docs/`.
- If a task conflicts with an architectural rule, stop and raise it rather than silently
  diverging.

## 7. Definition of Done (any task)

- Code + tests written; `build`, `lint`, `typecheck`, `test` green locally and in CI.
- Docs updated (architecture / API / data-model / ADR as applicable).
- No new `any`, no new lint disables without justification.
- Boundary inputs validated; store queries `userId`-scoped.
- Phase gate items for the current phase still pass.
