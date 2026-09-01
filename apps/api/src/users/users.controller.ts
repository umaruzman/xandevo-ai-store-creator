import { Controller, Get } from '@nestjs/common';
import { type User } from '@prisma/client';

import { CurrentUser } from '../auth/current-user.decorator';

export interface MeResponse {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  createdAt: string;
}

@Controller()
export class UsersController {
  /** The authenticated user. Guarded globally by `JwtAuthGuard`. */
  @Get('me')
  me(@CurrentUser() user: User): MeResponse {
    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt.toISOString(),
    };
  }
}
