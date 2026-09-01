import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { type User } from '@prisma/client';

/** Rate-limit per authenticated user; fall back to IP for public routes. */
@Injectable()
export class UserThrottlerGuard extends ThrottlerGuard {
  protected override getTracker(req: { user?: User; ip?: string }): Promise<string> {
    return Promise.resolve(req.user?.id ?? req.ip ?? 'anonymous');
  }
}
