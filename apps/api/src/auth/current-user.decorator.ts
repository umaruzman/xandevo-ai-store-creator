import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import { type User } from '@prisma/client';

/** The authenticated user, provisioned by `JwtStrategy.validate`. */
export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext): User => {
  const request = ctx.switchToHttp().getRequest<{ user: User }>();
  return request.user;
});
