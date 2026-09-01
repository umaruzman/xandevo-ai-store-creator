import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';

import { UsersModule } from '../users/users.module';
import { JwtStrategy } from './jwt.strategy';

/**
 * Registers the JWT passport strategy. The global `JwtAuthGuard` is wired as an
 * `APP_GUARD` in `AppModule` (ordered before the throttler guard so rate limits
 * can key on the authenticated user).
 */
@Module({
  imports: [PassportModule, UsersModule],
  providers: [JwtStrategy],
})
export class AuthModule {}
