import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';
import { AiInteractionLogger } from './ai-interaction.logger';
import { GenerationController } from './generation.controller';
import { GenerationService } from './generation.service';
import { PromptBuilder } from './prompt-builder';

@Module({
  imports: [PrismaModule],
  controllers: [GenerationController],
  providers: [GenerationService, PromptBuilder, AiInteractionLogger],
})
export class GenerationModule {}
