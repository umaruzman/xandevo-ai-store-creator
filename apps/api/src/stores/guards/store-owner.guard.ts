import { CanActivate, type ExecutionContext, Injectable, NotFoundException } from '@nestjs/common';
import { type User } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';

/**
 * 404s (not 403s — avoids confirming existence) when `:id` is missing or not
 * owned by the authenticated user. Services still re-scope every query by
 * `userId` (defense in depth).
 */
@Injectable()
export class StoreOwnerGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<{ user: User; params: { id?: string } }>();
    const id = req.params.id;
    if (!id) throw new NotFoundException({ code: 'STORE_NOT_FOUND', message: 'Store not found' });

    const store = await this.prisma.store.findFirst({
      where: { id, userId: req.user.id },
      select: { id: true },
    });
    if (!store)
      throw new NotFoundException({ code: 'STORE_NOT_FOUND', message: 'Store not found' });
    return true;
  }
}
