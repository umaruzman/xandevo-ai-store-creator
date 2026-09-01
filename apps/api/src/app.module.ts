import { Module, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_PIPE } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';

import { AiModule } from './ai/ai.module';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { AllExceptionsFilter } from './common/all-exceptions.filter';
import { UserThrottlerGuard } from './common/user-throttler.guard';
import { GenerationModule } from './generation/generation.module';
import { HealthModule } from './health/health.module';
import { PrismaModule } from './prisma/prisma.module';
import { StoresModule } from './stores/stores.module';
import { UsersModule } from './users/users.module';

/**
 * Root module. Phase 5: config + Prisma + AI provider + auth (global JWT guard) +
 * users + generation + health, with a global validation pipe, standard error
 * filter, and per-user rate limiting. The request-id middleware and body-parser
 * limit are applied in `bootstrap.ts` (see the note there).
 */
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 240 }]),
    PrismaModule,
    AiModule,
    AuthModule,
    UsersModule,
    GenerationModule,
    StoresModule,
    HealthModule,
  ],
  providers: [
    // Order matters: auth first, so the throttler can key on `req.user`.
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: UserThrottlerGuard },
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
  ],
})
export class AppModule {}
