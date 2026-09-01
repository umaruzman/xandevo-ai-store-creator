import { Test } from '@nestjs/testing';
import { type NestExpressApplication } from '@nestjs/platform-express';
import {
  API_JWT_ALGORITHM,
  API_JWT_AUDIENCE,
  API_JWT_ISSUER,
  type ApiJwtClaims,
} from '@xandevo/shared';
import { SignJWT } from 'jose';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { configureApp } from '../src/bootstrap';
import { PrismaService } from '../src/prisma/prisma.service';

const SECRET = 'e2e-secret-at-least-16-characters-long';

async function mint(
  claims: ApiJwtClaims,
  overrides: { secret?: string; issuer?: string; audience?: string; expiresIn?: string } = {},
): Promise<string> {
  return new SignJWT({ ...claims })
    .setProtectedHeader({ alg: API_JWT_ALGORITHM })
    .setIssuedAt()
    .setIssuer(overrides.issuer ?? API_JWT_ISSUER)
    .setAudience(overrides.audience ?? API_JWT_AUDIENCE)
    .setExpirationTime(overrides.expiresIn ?? '15m')
    .sign(new TextEncoder().encode(overrides.secret ?? SECRET));
}

describe('Auth (e2e)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  const claims: ApiJwtClaims = {
    sub: `e2e-${Date.now()}`,
    email: 'e2e@example.com',
    name: 'E2E User',
  };

  beforeAll(async () => {
    process.env.AUTH_JWT_SECRET = SECRET;
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication<NestExpressApplication>();
    configureApp(app);
    await app.init();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { googleSub: { startsWith: 'e2e-' } } });
    await app.close();
  });

  it('rejects GET /me without a token (401)', () =>
    request(app.getHttpServer()).get('/me').expect(401));

  it('rejects a token signed with the wrong secret (401)', async () => {
    const token = await mint(claims, { secret: 'the-wrong-secret-16-characters' });
    return request(app.getHttpServer())
      .get('/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(401);
  });

  it('rejects a token with the wrong audience (401)', async () => {
    const token = await mint(claims, { audience: 'someone-else' });
    return request(app.getHttpServer())
      .get('/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(401);
  });

  it('rejects a token with the wrong issuer (401)', async () => {
    const token = await mint(claims, { issuer: 'evil-web' });
    return request(app.getHttpServer())
      .get('/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(401);
  });

  it('rejects an expired token (401)', async () => {
    const token = await mint(claims, { expiresIn: '-1m' });
    return request(app.getHttpServer())
      .get('/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(401);
  });

  it('accepts a valid token, provisioning the user on first call', async () => {
    const token = await mint(claims);
    const res = await request(app.getHttpServer())
      .get('/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body).toMatchObject({
      email: claims.email,
      displayName: 'E2E User',
    });
    expect(res.body.id).toEqual(expect.any(String));

    const row = await prisma.user.findUnique({ where: { googleSub: claims.sub } });
    expect(row?.email).toBe(claims.email);
  });

  it('keeps health endpoints public', () =>
    request(app.getHttpServer()).get('/health').expect(200, { status: 'ok' }));
});
