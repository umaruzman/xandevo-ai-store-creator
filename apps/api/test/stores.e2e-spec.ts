import { Test } from '@nestjs/testing';
import { type NestExpressApplication } from '@nestjs/platform-express';
import {
  API_JWT_ALGORITHM,
  API_JWT_AUDIENCE,
  API_JWT_ISSUER,
  buildStoreDefinition,
  sequentialIdFactory,
  validStoreDefinitionInput,
} from '@xandevo/shared';
import { SignJWT } from 'jose';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { configureApp } from '../src/bootstrap';
import { PrismaService } from '../src/prisma/prisma.service';
import { StoresRepository } from '../src/stores/stores.repository';

const SECRET = 'stores-e2e-secret-at-least-16-chars';

const tokenFor = (sub: string, email: string) =>
  new SignJWT({ email, name: 'Store E2E' })
    .setProtectedHeader({ alg: API_JWT_ALGORITHM })
    .setSubject(sub)
    .setIssuer(API_JWT_ISSUER)
    .setAudience(API_JWT_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime('15m')
    .sign(new TextEncoder().encode(SECRET));

const normalizedDefinition = () =>
  buildStoreDefinition(validStoreDefinitionInput(), { idFactory: sequentialIdFactory() });

const createBody = () => ({
  name: 'My E2E Store',
  prompt: 'a luxury perfume store for the UAE',
  promptVersion: 'store@v1',
  definition: normalizedDefinition(),
});

describe('Stores (e2e)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  const subA = `stores-a-${Date.now()}`;
  const subB = `stores-b-${Date.now()}`;
  let tokenA = '';
  let tokenB = '';

  beforeAll(async () => {
    process.env.AUTH_JWT_SECRET = SECRET;
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication<NestExpressApplication>();
    configureApp(app);
    await app.init();
    prisma = app.get(PrismaService);
    tokenA = await tokenFor(subA, 'a@example.com');
    tokenB = await tokenFor(subB, 'b@example.com');
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { googleSub: { in: [subA, subB] } } });
    await app.close();
  });

  const auth = (t: string) => ({ Authorization: `Bearer ${t}` });

  it('401 without a token', () => request(app.getHttpServer()).get('/stores').expect(401));

  it('422 when the definition fails validation', async () => {
    const body = createBody();
    body.definition.products[0]!.currency = 'USD'; // mismatches meta.currency
    const res = await request(app.getHttpServer())
      .post('/stores')
      .set(auth(tokenA))
      .send(body)
      .expect(422);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('full loop: create → list → get (equal) → patch → get (reflects) → delete → 404', async () => {
    const created = await request(app.getHttpServer())
      .post('/stores')
      .set(auth(tokenA))
      .send(createBody())
      .expect(201);

    const id: string = created.body.id;
    expect(created.body.definition.pages).toHaveLength(3);
    expect(created.body.name).toBe('My E2E Store');
    expect(created.body.status).toBe('saved');

    const list = await request(app.getHttpServer()).get('/stores').set(auth(tokenA)).expect(200);
    expect(list.body.items.map((s: { id: string }) => s.id)).toContain(id);
    expect(list.body.items[0]).not.toHaveProperty('definition'); // summary only

    const got = await request(app.getHttpServer())
      .get(`/stores/${id}`)
      .set(auth(tokenA))
      .expect(200);
    // reload equals what was saved (after name override)
    expect(got.body.definition).toEqual(created.body.definition);

    const edited = normalizedDefinition();
    const hero = edited.pages.find((p) => p.slug === 'home')!.sections[0]!;
    if (hero.type === 'hero') hero.headline = 'A Freshly Edited Headline';
    await request(app.getHttpServer())
      .patch(`/stores/${id}`)
      .set(auth(tokenA))
      .send({ definition: edited })
      .expect(200);

    const afterPatch = await request(app.getHttpServer())
      .get(`/stores/${id}`)
      .set(auth(tokenA))
      .expect(200);
    const patchedHero = afterPatch.body.definition.pages.find(
      (p: { slug: string }) => p.slug === 'home',
    ).sections[0];
    expect(patchedHero.headline).toBe('A Freshly Edited Headline');
    expect(afterPatch.body.definition.schemaVersion).toBe(1);

    await request(app.getHttpServer())
      .patch(`/stores/${id}`)
      .set(auth(tokenA))
      .send({ name: 'Renamed' })
      .expect(200);
    const renamed = await request(app.getHttpServer())
      .get(`/stores/${id}`)
      .set(auth(tokenA))
      .expect(200);
    expect(renamed.body.name).toBe('Renamed');

    await request(app.getHttpServer()).delete(`/stores/${id}`).set(auth(tokenA)).expect(204);
    await request(app.getHttpServer()).get(`/stores/${id}`).set(auth(tokenA)).expect(404);
  });

  it("a second user cannot see or touch the first user's store (404, not 403)", async () => {
    const created = await request(app.getHttpServer())
      .post('/stores')
      .set(auth(tokenA))
      .send(createBody())
      .expect(201);
    const id: string = created.body.id;

    await request(app.getHttpServer()).get(`/stores/${id}`).set(auth(tokenB)).expect(404);
    await request(app.getHttpServer())
      .patch(`/stores/${id}`)
      .set(auth(tokenB))
      .send({ name: 'hijack' })
      .expect(404);
    await request(app.getHttpServer()).delete(`/stores/${id}`).set(auth(tokenB)).expect(404);

    const listB = await request(app.getHttpServer()).get('/stores').set(auth(tokenB)).expect(200);
    expect(listB.body.items.map((s: { id: string }) => s.id)).not.toContain(id);

    await request(app.getHttpServer()).delete(`/stores/${id}`).set(auth(tokenA)).expect(204);
  });

  it('a failure inside the write transaction rolls the whole aggregate back', async () => {
    const repo = app.get(StoresRepository);
    const original = (repo as unknown as { insertChildren: unknown }).insertChildren;
    (repo as unknown as { insertChildren: () => Promise<never> }).insertChildren = () => {
      throw new Error('boom mid-transaction');
    };

    await request(app.getHttpServer())
      .post('/stores')
      .set(auth(tokenA))
      .send(createBody())
      .expect(500);

    (repo as unknown as { insertChildren: unknown }).insertChildren = original;

    const count = await prisma.store.count({ where: { user: { googleSub: subA } } });
    expect(count).toBe(0); // the store row was rolled back with its (never-written) children
  });

  it('Product.categoryId is ON DELETE RESTRICT at the DB level', async () => {
    const created = await request(app.getHttpServer())
      .post('/stores')
      .set(auth(tokenA))
      .send(createBody())
      .expect(201);
    const storeId: string = created.body.id;
    const cat = await prisma.category.findFirst({ where: { storeId } });

    await expect(prisma.category.delete({ where: { id: cat!.id } })).rejects.toMatchObject({
      code: 'P2003',
    });

    await request(app.getHttpServer()).delete(`/stores/${storeId}`).set(auth(tokenA)).expect(204);
  });
});
