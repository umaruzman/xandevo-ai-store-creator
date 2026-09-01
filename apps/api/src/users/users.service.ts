import { Injectable } from '@nestjs/common';
import { type User } from '@prisma/client';
import { type ApiJwtClaims } from '@xandevo/shared';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * First-login provisioning + profile refresh, keyed by the Google subject
   * (`sub`) — the stable identity. Email/name/avatar are kept in sync on each
   * authenticated request.
   */
  async upsertFromClaims(claims: ApiJwtClaims): Promise<User> {
    const displayName = claims.name?.trim() || claims.email.split('@')[0] || 'User';
    return this.prisma.user.upsert({
      where: { googleSub: claims.sub },
      create: {
        googleSub: claims.sub,
        email: claims.email,
        displayName,
        avatarUrl: claims.picture ?? null,
      },
      update: {
        email: claims.email,
        displayName,
        avatarUrl: claims.picture ?? null,
      },
    });
  }

  findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }
}
