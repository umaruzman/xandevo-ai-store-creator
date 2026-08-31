import { Module } from '@nestjs/common';

import { HealthModule } from './health/health.module';

/**
 * Root module. Phase 2: wires only HealthModule.
 * Feature modules (Auth, Users, Stores, Generation, Ai) arrive in later phases —
 * see docs/architecture/backend-architecture.md.
 */
@Module({
  imports: [HealthModule],
})
export class AppModule {}
