# Architectural Self-Review (end of Phase 1)

Answers to the 20 review questions, plus tradeoffs.

1. **Incrementally implementable?** Yes. The 12 phases have a clean dependency chain; each
   delivers a runnable, gated increment. The Store Definition schema (Phase 3) is the
   linchpin and comes early.
2. **Over-engineered?** Deliberately not. No queue/Redis/CDN/microservices/CQRS in MVP.
   Pragmatic clean architecture without per-model entity/mapper layers. Document-first DB.
3. **Boundaries clear?** Yes: two apps + two pure packages; NestJS modules with narrow
   exports; vendor SDKs quarantined to `src/ai/providers`; Prisma quarantined to repositories.
4. **Idiomatic Next.js 15?** Yes: App Router, RSC-by-default, route groups, `loading`/`error`
   conventions, client islands only for interactive leaves, Server Actions as thin proxies.
5. **NestJS modular?** Yes: DI, global infra modules, feature modules, thin controllers,
   service/domain/repository split, DTO validation, guards, exception filter.
6. **Database model appropriate?** Yes — normalized (ADR-006, revised): section content and
   every cross-entity reference are relational (`sections` base + per-type `<type>_sections`
   tables + FK join tables), so a section cannot reference a missing category/page. Only
   `Store.theme` / `Store.navigation` stay validated JSON. The Store Definition remains the
   contract, mapped to/from rows by a tested `store-definition.mapper`. Cost: ~15 tables and
   a per-type mapper in Phase 3, and each new section type is a migration. Benefit:
   DB-enforced integrity, entity-level querying, field-granular edits, clean path to public
   storefronts.
7. **AI provider replaceable?** Yes — single `AiProvider` interface, config-selected impl,
   3 target vendors, cross-cutting concerns outside impls.
8. **AI output safely controlled?** Yes — mandatory parse → Zod → business → sanitize →
   normalize; no code/HTML/URLs from the model; injection guard in prompts.
9. **New storefront components / more visual variety?** Yes. Coarse identity via
   `theme.preset`; reusable `theme.components` variants; shared + type-specific section
   `layout` enums; store-level `header`/`footer`/`announcementBar`. Every value is a bounded
   enum with one predefined renderer recipe — no raw CSS from the model. New section type =
   the §5 checklist (schema + `<type>_sections` table + mapper + registry + editor + prompt).
10. **Editor edits structured data cleanly?** Yes — `updateField(path,value)` validates via
    Zod sub-schema and immutably replaces `definition`; no DOM manipulation.
11. **Persist & restore generated stores?** Yes — one JSON document per store; save = create/
    patch; reopen hydrates the builder store.
12. **Authentication isolated?** Yes — OAuth/session in web; JWT verification in `AuthModule`;
    authorization via guards + `userId`-scoped queries; 404 on non-owned.
13. **Backend scales horizontally?** Yes — stateless (JWT, no in-process state), any instance
    serves any request.
14. **Large number of stores?** Yes with indexes now; read replicas, Redis, `userId` hash
    partitioning documented as future steps.
15. **Explainable to a senior dev?** Yes — one diagram, one central contract (Store
    Definition), conventional module layout, ADRs for the non-obvious calls.
16. **Unnecessary abstractions?** Minimized. The one deliberate abstraction (`AiProvider`)
    has 3 concrete targets. Repository classes are thin but justified for testability +
    Prisma quarantine.
17. **Hidden coupling?** The Store Definition schema couples both apps — intentional and
    monorepo-managed. Web↔API coupling is the explicit REST contract. No implicit coupling.
18. **Security concerns?** Addressed in `security.md`: authZ isolation, boundary validation,
    AI content safety, XSS, rate limits, payload limits, secret handling, logging hygiene.
    Residual: no instant global logout (short TTL mitigates); SSRF surface deferred with
    image uploads.
19. **Testing gaps?** Strategy covers unit/integration/e2e with clear mock/real split.
    Gap to watch: provider contract drift (mitigated by fixture contract tests) and prompt
    regression (mitigated by an eval fixture set).
20. **Clean foundation for future phases?** Yes — CLAUDE.md + skills + docs + roadmap +
    gates give future sessions a consistent frame.

## Key tradeoffs accepted

| Tradeoff | Choice | Cost |
|---|---|---|
| Visual freedom vs safety/editability | Structured Store Definition, no generated code | New layouts need a new section type |
| Build speed vs integrity & queryability | Normalized schema, per-type section tables + FK refs, mapper | ~15 tables; each new section type = a migration + mapper branch |
| Normalize everything vs pragmatism | Presentation blobs (`theme`, `navigation`, `header`, `footer`, `announcementBar`) stay validated JSON | No DB constraints on token internals (Zod covers it) |
| Visual variety vs simplicity | Bounded enum/token variant system (preset + components + section layout) | More renderer recipes, editor controls, prompt guidance; per-enum (not cross-product) snapshot tests |
| Two runtimes vs single Next.js app | Separate NestJS API as system of record | Extra network hop, two deploys |
| Two state libs vs one | TanStack Query + Zustand | Discipline needed to not duplicate the draft |
| Provider abstraction cost | `AiProvider` interface | Must map each vendor's structured-output API |
| Short JWT vs sessions | Stateless JWT | No instant revocation |

## Decisions — all resolved (2026-09-01)

See `docs/decisions/OPEN-QUESTIONS.md`: Auth.js + JWT (A), fully normalized DB (B),
Anthropic default, hosting deferred (prioritise one-command local dev), section set as
proposed, placeholder images. ADR-001..007 Accepted.
