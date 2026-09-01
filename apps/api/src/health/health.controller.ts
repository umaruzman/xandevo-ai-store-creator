import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

@Controller()
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  /** Liveness — the process is up. */
  @Get('health')
  health(): { status: 'ok' } {
    return { status: 'ok' };
  }

  /** Readiness — dependencies (the database) are reachable. */
  @Get('ready')
  async ready(): Promise<{ status: 'ok' }> {
    if (!(await this.prisma.isHealthy())) {
      throw new ServiceUnavailableException({
        status: 'unavailable',
        detail: 'database unreachable',
      });
    }
    return { status: 'ok' };
  }
}
