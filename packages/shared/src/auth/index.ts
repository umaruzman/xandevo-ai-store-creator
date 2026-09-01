/**
 * The contract for the short-lived JWT the web app mints and the API verifies
 * (ADR-005). Both apps import these so issuer/audience/TTL can never drift.
 *
 * The token is HS256-signed with `AUTH_JWT_SECRET` (shared secret) and carries
 * the Google identity. It is NOT the Auth.js session token — it is a dedicated,
 * minimal, stateless credential for API calls.
 */

export const API_JWT_ISSUER = 'xandevo-web';
export const API_JWT_AUDIENCE = 'xandevo-api';
export const API_JWT_ALGORITHM = 'HS256';

/** 15 minutes. The web app re-mints on demand from the live Auth.js session. */
export const API_JWT_TTL_SECONDS = 900;

/** Claims carried by the API JWT (in addition to standard `iss`/`aud`/`exp`/`iat`). */
export interface ApiJwtClaims {
  /** Google subject identifier — the stable user identity. */
  sub: string;
  email: string;
  name?: string;
  picture?: string;
}
