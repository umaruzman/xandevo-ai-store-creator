import { Controller, Get } from '@nestjs/common';

/**
 * Liveness / readiness. Phase 2: static responses.
 * `ready` gains a real DB check once Prisma lands in Phase 3.
 */
@Controller()
export class HealthController {
  @Get('health')
  health(): { status: 'ok' } {
    return { status: 'ok' };
  }

  @Get('ready')
  ready(): { status: 'ok' } {
    return { status: 'ok' };
  }
}
