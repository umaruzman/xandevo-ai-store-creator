import { Module } from '@nestjs/common';

import { GenerationController } from './generation.controller';
import { GenerationService } from './generation.service';
import { PromptBuilder } from './prompt-builder';

@Module({
  controllers: [GenerationController],
  providers: [GenerationService, PromptBuilder],
})
export class GenerationModule {}
