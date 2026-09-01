import {
  API_JWT_ALGORITHM,
  API_JWT_AUDIENCE,
  API_JWT_ISSUER,
  API_JWT_TTL_SECONDS,
  type ApiJwtClaims,
} from '@xandevo/shared';
import { SignJWT } from 'jose';

function secret(): Uint8Array {
  const value = process.env.AUTH_JWT_SECRET;
  if (!value || value.length < 16) {
    throw new Error('AUTH_JWT_SECRET is missing or too short (need >= 16 chars)');
  }
  return new TextEncoder().encode(value);
}

/**
 * Mint the short-lived HS256 JWT the API verifies (ADR-005). Server-only — the
 * secret and this function must never reach the browser bundle.
 */
export async function mintApiToken(claims: ApiJwtClaims): Promise<string> {
  return new SignJWT({ email: claims.email, name: claims.name, picture: claims.picture })
    .setProtectedHeader({ alg: API_JWT_ALGORITHM })
    .setSubject(claims.sub)
    .setIssuer(API_JWT_ISSUER)
    .setAudience(API_JWT_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${API_JWT_TTL_SECONDS}s`)
    .sign(secret());
}
