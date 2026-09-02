# Setup & run

Get Xandevo running locally in about five minutes.

## 1. Prerequisites

Install these once. Nothing else is global.

| Tool | Version | Notes |
|---|---|---|
| Node | 22 | `.nvmrc` is committed — run `nvm use` (or `fnm use`) in the repo root |
| pnpm | 10 | `corepack enable` turns it on from the Node install |
| Docker | any recent | runs the local PostgreSQL container |

A first `pnpm build` also needs internet once, to download the web fonts.

## 2. Install dependencies

```bash
pnpm install
```

## 3. Create the env files

Each app reads its own `.env` (both are git-ignored). Copy the templates:

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

Now fill in the four values that matter. Everything else in the templates already points at
local defaults and can be left alone.

### `apps/api/.env`

| Key | What to set |
|---|---|
| `ANTHROPIC_API_KEY` | Your key from [console.anthropic.com](https://console.anthropic.com) → *API Keys*. Anthropic is the AI provider (see [AI provider](#ai-provider) below). |
| `AUTH_JWT_SECRET` | Any random string, 16+ characters. **Must be byte-for-byte identical** to the one in `apps/web/.env`. |

Optional: set `AI_LOG_INTERACTIONS=true` to record every prompt and response to a database
table you can browse — see [Inspecting AI calls](#inspecting-ai-calls).

### `apps/web/.env`

| Key | What to set |
|---|---|
| `AUTH_SECRET` | Run `npx auth secret` and paste the result (any 32+ char random string works). |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | A Google OAuth client — see [Google sign-in](#google-sign-in). |
| `AUTH_JWT_SECRET` | The **same value** you put in `apps/api/.env`. |

## 4. Start PostgreSQL

```bash
pnpm db:up        # Docker: PostgreSQL 16 on host port 5433
pnpm db:migrate   # apply the schema + generate the Prisma client
```

`pnpm db:down` stops it; `pnpm db:logs` tails it. Data persists between restarts in a Docker
volume.

## 5. Run the app

```bash
pnpm dev
```

Turborepo starts both apps with hot reload:

- **Web** → http://localhost:3000
- **API** → http://localhost:4000

Open http://localhost:3000, sign in with Google, and create a store.

Quick health checks:

```bash
curl localhost:4000/health   # {"status":"ok"}       — process is up
curl localhost:4000/ready    # {"status":"ready"}    — database is reachable
```

---

## AI provider

Generation runs on **Anthropic Claude**, and Anthropic is the **only provider implemented
right now**. Set `ANTHROPIC_API_KEY` in `apps/api/.env` and leave `AI_PROVIDER=anthropic`
(the default). `ANTHROPIC_MODEL` defaults to `claude-sonnet-5`.

The `AiProvider` interface is vendor-neutral by design, so OpenAI and Gemini can be added
later without touching application code — but they are not wired up yet.

> There is also `AI_PROVIDER=fake`, which returns a fixed sample store with no API call. It
> exists for CI and offline work on non-AI features; it does not exercise real generation, so
> use a real key for normal development.

## Google sign-in

Sign-in is the one part that needs a real external credential.

1. Go to [console.cloud.google.com](https://console.cloud.google.com) → **APIs & Services →
   Credentials → Create credentials → OAuth client ID**.
2. Application type: **Web application**.
3. Authorized redirect URI (exactly): `http://localhost:3000/api/auth/callback/google`
4. Copy the **Client ID** and **Client secret** into `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET`
   in `apps/web/.env`.
5. Make sure `AUTH_URL=http://localhost:3000` (already the default).

## Everyday commands

| Command | Does |
|---|---|
| `pnpm dev` | web (`:3000`) + api (`:4000`) with hot reload |
| `pnpm build` / `pnpm lint` / `pnpm typecheck` / `pnpm test` | workspace-wide via Turborepo |
| `pnpm --filter @xandevo/api test:e2e` | API end-to-end tests (needs `pnpm db:up`) |
| `pnpm db:up` / `pnpm db:down` / `pnpm db:logs` | local PostgreSQL lifecycle |
| `pnpm db:migrate` | `prisma migrate dev` in `apps/api` |
| `pnpm --filter @xandevo/api db:studio` | Prisma Studio — browse the database in the browser |
| `pnpm format` | Prettier write |

## Inspecting AI calls

With `AI_LOG_INTERACTIONS=true` in `apps/api/.env`, every provider call (each retry included)
is written to the `ai_interactions` table with the **exact system + user prompt sent**, the
**raw model output**, any validation errors, token counts (including cache reads/writes) and
an estimated cost.

Browse it with `pnpm --filter @xandevo/api db:studio` (model **AiInteraction**), or any
PostgreSQL client on `postgresql://xandevo:xandevo@localhost:5433/xandevo`.

Regardless of that flag, the API prints a one-line `{"event":"generation",…}` summary per
request to stdout (tokens, cost, attempt count — no prompt text).

## Troubleshooting

| Symptom | Fix |
|---|---|
| `pnpm db:up` fails / port `5433` in use | Another PostgreSQL is on `5432`; this project maps `5433:5432` on purpose. Stop the other server, or change the host port in `docker-compose.yml` **and** `DATABASE_URL`. |
| First `pnpm build` fails downloading fonts | The web build fetches Google fonts once via `next/font`. Run it with internet available; it is cached afterwards. |
| Google sign-in returns a redirect error | The OAuth client's redirect URI must be exactly `http://localhost:3000/api/auth/callback/google`, and `AUTH_URL` must be `http://localhost:3000`. |
| Every API request returns 401 | `AUTH_JWT_SECRET` is not identical in the two `.env` files. |
| `POST /generate` returns 503 | Missing or invalid `ANTHROPIC_API_KEY`. |
