import { Body, Controller, HttpCode, HttpStatus, Post, Req } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { type User } from '@prisma/client';
import { type GenerateStoreResponse } from '@xandevo/shared';

import { CurrentUser } from '../auth/current-user.decorator';
import { type RequestWithId } from '../common/request-id.middleware';
import { GenerateStoreDto } from './dto/generate-store.dto';
import { GenerationService } from './generation.service';

@Controller()
export class GenerationController {
  constructor(private readonly generation: GenerationService) {}

  /**
   * Generate a Store Definition from a prompt. Does NOT persist (Phase 9).
   * Auth is enforced by the global guard; tighter rate limit than the default.
   */
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @Post('generate')
  generate(
    @Body() dto: GenerateStoreDto,
    @CurrentUser() user: User,
    @Req() req: RequestWithId,
  ): Promise<GenerateStoreResponse> {
    return this.generation.generate({
      prompt: dto.prompt,
      userId: user.id,
      requestId: req.requestId,
    });
  }
}
