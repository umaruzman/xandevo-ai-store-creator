import { ServiceUnavailableException } from '@nestjs/common';
import { Test } from '@nestjs/testing';

import { PrismaService } from '../prisma/prisma.service';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  const prisma = { isHealthy: jest.fn() };

  const build = async (): Promise<HealthController> => {
    const moduleRef = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [{ provide: PrismaService, useValue: prisma }],
    }).compile();
    return moduleRef.get(HealthController);
  };

  afterEach(() => jest.resetAllMocks());

  it('reports liveness without touching the database', async () => {
    const controller = await build();
    expect(controller.health()).toEqual({ status: 'ok' });
    expect(prisma.isHealthy).not.toHaveBeenCalled();
  });

  it('reports readiness when the database is reachable', async () => {
    prisma.isHealthy.mockResolvedValue(true);
    const controller = await build();
    await expect(controller.ready()).resolves.toEqual({ status: 'ok' });
  });

  it('fails readiness when the database is unreachable', async () => {
    prisma.isHealthy.mockResolvedValue(false);
    const controller = await build();
    await expect(controller.ready()).rejects.toBeInstanceOf(ServiceUnavailableException);
  });
});
