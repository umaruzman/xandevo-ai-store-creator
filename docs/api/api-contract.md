# API Contract

Base URL: `${NEXT_PUBLIC_API_URL}` (e.g. `http://localhost:4000`). All routes are JSON.
Auth: `Authorization: Bearer <jwt>` unless noted. **Not implemented yet — Phase 9.**

## Conventions

- Success: `2xx` with the resource/collection as the body.
- Error envelope:
  ```json
  { "error": { "code": "STORE_NOT_FOUND", "message": "Store not found", "requestId": "req_abc", "details": [] } }
  ```
- `code` is a stable SCREAMING_SNAKE string. `details` carries field-level validation errors.
- Validation failure → `400 VALIDATION_ERROR`. Auth missing/invalid → `401 UNAUTHENTICATED`.
  Ownership/permission → `404 STORE_NOT_FOUND` (not 403, to avoid resource disclosure).
  AI pipeline failure → `422 AI_GENERATION_FAILED`. Rate limit → `429 RATE_LIMITED`.
  Provider down → `503 AI_UNAVAILABLE`.
- Timestamps ISO-8601 UTC. Ids are uuid strings. Money is `priceMinor` (int) + `currency`.

Types below reference schemas in `packages/shared`.

---

## GET /me

- **Purpose:** current authenticated user.
- **Auth:** required.
- **Response 200:** `{ id, email, displayName, avatarUrl, createdAt }`
- **Errors:** 401.

---

## POST /generate

- **Purpose:** generate a Store Definition from a prompt. **Does not persist.**
- **Auth:** required. **Rate limit:** ~10/min/user. **Body limit:** 2 KB.
- **Request DTO:** `{ "prompt": string (10..1000 chars, trimmed, non-empty) }`
- **Response 200:** `{ "definition": StoreDefinition, "promptVersion": string, "usage": { "inputTokens": number, "outputTokens": number } }`
- **Validation:** prompt length/charset; HTML stripped server-side.
- **Authorization:** any authenticated user.
- **Errors:** 400 VALIDATION_ERROR, 401, 422 AI_GENERATION_FAILED (parse/schema/business/
  sanitization failure), 429 RATE_LIMITED, 503 AI_UNAVAILABLE.

---

## POST /stores

- **Purpose:** create and save a store.
- **Auth:** required. **Body limit:** 128 KB.
- **Request DTO:**
  ```
  { "name": string (1..80),
    "prompt": string (10..1000),
    "promptVersion": string,
    "definition": StoreDefinition }
  ```
- **Validation:** DTO constraints + full Store Definition pipeline (schema → business →
  sanitize → normalize) re-run server-side; client-supplied `definition` is never trusted.
- **Authorization:** creates under `currentUser.id`.
- **Response 201:** `Store` (full: metadata + normalized `definition`).
- **Errors:** 400, 401, 422 (definition invalid), 429.

---

## GET /stores

- **Purpose:** list the current user's stores (summaries).
- **Auth:** required.
- **Query:** `?limit=1..50 (default 20)&cursor=<id>` (cursor pagination).
- **Response 200:** `{ "items": StoreSummary[], "nextCursor": string | null }`
  where `StoreSummary = { id, name, slug, status, updatedAt }` (no `definition`).
- **Authorization:** filtered by `userId`.
- **Errors:** 400 (bad pagination), 401.

---

## GET /stores/:id

- **Purpose:** full store for the builder.
- **Auth:** required. **Authorization:** owner only.
- **Response 200:** `Store` (metadata + full `definition` + `schemaVersion`).
- **Errors:** 401, 404 STORE_NOT_FOUND (missing or not owned).

---

## PATCH /stores/:id

- **Purpose:** save edits from the editor.
- **Auth:** required. **Authorization:** owner only. **Body limit:** 128 KB.
- **Request DTO (all optional, ≥1 required):**
  `{ "name"?: string (1..80), "definition"?: StoreDefinition, "status"?: "draft" | "saved" }`
- **Validation:** if `definition` present, full pipeline re-run; `schemaVersion` must be
  supported (older versions migrated forward, rejected if unmigratable → 409 SCHEMA_UNSUPPORTED).
- **Response 200:** updated `Store`.
- **Errors:** 400, 401, 404, 409 SCHEMA_UNSUPPORTED, 422.

---

## DELETE /stores/:id

- **Purpose:** delete a store.
- **Auth:** required. **Authorization:** owner only.
- **Response 204:** empty.
- **Errors:** 401, 404.

---

## GET /health , GET /ready

- **Purpose:** liveness / readiness (DB reachable).
- **Auth:** none.
- **Response 200:** `{ "status": "ok" }` / `503` when not ready.

---

## Not in MVP (documented for later)

`POST /stores/:id/regenerate` (re-run generation into an existing store),
`GET /stores/:id/versions` + `POST /stores/:id/versions/:v/restore` (version history),
`POST /media` (image upload), `POST /stores/:id/publish` (public storefront).
