import { Test } from '@nestjs/testing';

import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from './users.service';

describe('UsersService', () => {
  const prisma = { user: { upsert: jest.fn(), findUnique: jest.fn() } };
  let service: UsersService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [UsersService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = moduleRef.get(UsersService);
    jest.resetAllMocks();
  });

  it('upserts by googleSub and syncs profile fields', async () => {
    prisma.user.upsert.mockResolvedValue({ id: 'u1' });
    await service.upsertFromClaims({
      sub: 'google-123',
      email: 'umar@example.com',
      name: '  Umar Uzman  ',
      picture: 'https://pic/x.png',
    });

    expect(prisma.user.upsert).toHaveBeenCalledWith({
      where: { googleSub: 'google-123' },
      create: {
        googleSub: 'google-123',
        email: 'umar@example.com',
        displayName: 'Umar Uzman',
        avatarUrl: 'https://pic/x.png',
      },
      update: {
        email: 'umar@example.com',
        displayName: 'Umar Uzman',
        avatarUrl: 'https://pic/x.png',
      },
    });
  });

  it('falls back to the email local-part when no name is provided', async () => {
    prisma.user.upsert.mockResolvedValue({ id: 'u1' });
    await service.upsertFromClaims({ sub: 'g', email: 'jane.doe@example.com' });
    expect(prisma.user.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ create: expect.objectContaining({ displayName: 'jane.doe' }) }),
    );
  });
});
