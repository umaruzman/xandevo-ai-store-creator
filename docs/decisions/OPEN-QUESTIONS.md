# Open Questions — RESOLVED

All Phase 1 open questions were resolved by Umar on 2026-09-01. Kept for historical record.

| # | Question | Decision | Follow-up |
|---|---|---|---|
| Q1 | Authentication token model | **A** — Auth.js (Google) in `apps/web`, JWT session strategy, short-lived JWT presented to `apps/api`, user upserted by Google `sub`. | ADR-005 → Accepted. |
| Q2 | Database persistence model | **B, refined** — normalized. Section content + all cross-entity references in relational tables (`sections` base + per-type `<type>_sections` tables + FK join tables). Only `Store.theme` / `Store.navigation` stay validated JSON (presentation tokens). No whole-definition JSON blob. | ADR-006 rewritten → Accepted. `data-model.md` (new ER diagram), `store-definition.md`, backend docs, database + backend skills, roadmap Phase 3/9 updated. |
| Q3 | Default AI provider | **Anthropic** (`AI_PROVIDER=anthropic`). Fallback provider optional / not configured for MVP. | ADR-004 / ai-architecture updated. |
| Q4 | Hosting / deployment targets | **Deferred.** Planned later. For now: prioritise a one-command local dev setup (Docker Compose Postgres + `pnpm dev`). | Roadmap Phase 2 scope emphasises dev-environment ergonomics; Phase 12 runbook still covers deploy. |
| Q5 | Store Definition v1 section set | **As proposed** — `hero`, `categories`, `productGrid`, `richText`, `contact`, `cta`. Elaborated 2026-09-01 with a bounded **variation system**: `theme.preset`, expanded typography/style tokens, `theme.components` variants, shared + type-specific section `layout` enums, store-level `header`/`footer`/`announcementBar`, per-entity `featured`/`badge`/`accentColor`. All enum-keyed, no new section types. See `store-definition.md` §2. | `store-definition.md`, `data-model.md`, `prompt-engineering.md`, ADR-003/006, roadmap 3/7, frontend/ai skills updated. |
| Q6 | Placeholder image strategy | **Placeholders** — `{ kind: 'placeholder', seed }`; renderer generates SVG / allowlisted placeholder service. Real uploads and AI images are later phases. | No change. |

New questions raised during implementation should be appended below with a date.
