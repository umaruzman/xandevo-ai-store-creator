import { type INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import {
  API_JWT_ALGORITHM,
  API_JWT_AUDIENCE,
  API_JWT_ISSUER,
  validStoreDefinitionInput,
} from '@xandevo/shared';
import { SignJWT } from 'jose';
import request from 'supertest';

import { AI_PROVIDER, type AiProvider } from '../src/ai/ai-provider';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

const SECRET = 'generate-e2e-secret-at-least-16-chars';
const SUB = `gen-e2e-${Date.now()}`;

const token = () =>
  new SignJWT({ email: 'gen@example.com', name: 'Gen E2E' })
    .setProtectedHeader({ alg: API_JWT_ALGORITHM })
    .setSubject(SUB)
    .setIssuer(API_JWT_ISSUER)
    .setAudience(API_JWT_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime('15m')
    .sign(new TextEncoder().encode(SECRET));

const fakeProvider: AiProvider = {
  name: 'fake',
  generateStructured: jest.fn().mockImplementation(() =>
    Promise.resolve({
      data: validStoreDefinitionInput(),
      usage: { inputTokens: 111, outputTokens: 222 },
      raw: '{}',
      model: 'fake',
      providerMeta: {},
    }),
  ),
};

describe('POST /generate (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    process.env.AUTH_JWT_SECRET = SECRET;
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(AI_PROVIDER)
      .useValue(fakeProvider)
      .compile();
    app = moduleRef.createNestApplication();
    await app.init();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { googleSub: SUB } });
    await app.close();
  });

  it('401 without a token', () =>
    request(app.getHttpServer())
      .post('/generate')
      .send({ prompt: 'a nice store here' })
      .expect(401));

  it('400 with a too-short prompt, in the standard envelope', async () => {
    const res = await request(app.getHttpServer())
      .post('/generate')
      .set('Authorization', `Bearer ${await token()}`)
      .send({ prompt: 'short' })
      .expect(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.requestId).toEqual(expect.any(String));
  });

  it('200 with a validated, normalized definition and no secrets in the body', async () => {
    const res = await request(app.getHttpServer())
      .post('/generate')
      .set('Authorization', `Bearer ${await token()}`)
      .send({ prompt: 'a luxury perfume store for UAE customers' })
      .expect(200);

    expect(res.body.promptVersion).toBe('store@v1');
    expect(res.body.usage).toEqual({ inputTokens: 111, outputTokens: 222 });
    expect(res.body.definition.schemaVersion).toBe(1);
    expect(res.body.definition.pages).toHaveLength(3);
    expect(res.body.definition.pages[0].sections[0].id).toEqual(expect.any(String));
    expect(JSON.stringify(res.body)).not.toContain(SECRET);
  });

  it('429 after the per-minute limit is exceeded', async () => {
    const bearer = `Bearer ${await token()}`;
    const codes: number[] = [];
    for (let i = 0; i < 12; i += 1) {
      const res = await request(app.getHttpServer())
        .post('/generate')
        .set('Authorization', bearer)
        .send({ prompt: 'a minimal stationery store' });
      codes.push(res.status);
    }
    expect(codes.filter((c) => c === 429).length).toBeGreaterThan(0);
  });
});
