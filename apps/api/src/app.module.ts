import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { HealthModule } from './health/health.module';
import { PrismaModule } from './prisma/prisma.module';

/**
 * Root module. Phase 3: config + Prisma + health.
 * Feature modules (Auth, Users, Stores, Generation, Ai) arrive in later phases —
 * see docs/architecture/backend-architecture.md.
 */
@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), PrismaModule, HealthModule],
})
export class AppModule {}
