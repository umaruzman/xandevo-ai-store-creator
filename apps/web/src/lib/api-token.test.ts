// @vitest-environment node
import { API_JWT_AUDIENCE, API_JWT_ISSUER, API_JWT_TTL_SECONDS } from '@xandevo/shared';
import { jwtVerify } from 'jose';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { mintApiToken } from './api-token';

const SECRET = 'unit-test-secret-at-least-16-chars';

describe('mintApiToken', () => {
  beforeEach(() => {
    process.env.AUTH_JWT_SECRET = SECRET;
  });
  afterEach(() => {
    delete process.env.AUTH_JWT_SECRET;
  });

  it('mints an HS256 token the API can verify by issuer and audience', async () => {
    const token = await mintApiToken({ sub: 'google-1', email: 'u@x.com', name: 'U' });
    const { payload, protectedHeader } = await jwtVerify(token, new TextEncoder().encode(SECRET), {
      issuer: API_JWT_ISSUER,
      audience: API_JWT_AUDIENCE,
    });

    expect(protectedHeader.alg).toBe('HS256');
    expect(payload.sub).toBe('google-1');
    expect(payload.email).toBe('u@x.com');
    expect(payload.exp! - payload.iat!).toBe(API_JWT_TTL_SECONDS);
  });

  it('rejects verification under a different secret', async () => {
    const token = await mintApiToken({ sub: 's', email: 'e@x.com' });
    await expect(
      jwtVerify(token, new TextEncoder().encode('some-other-secret-16xxxx')),
    ).rejects.toThrow();
  });

  it('throws when AUTH_JWT_SECRET is missing', async () => {
    delete process.env.AUTH_JWT_SECRET;
    await expect(mintApiToken({ sub: 's', email: 'e@x.com' })).rejects.toThrow(/AUTH_JWT_SECRET/);
  });
});
