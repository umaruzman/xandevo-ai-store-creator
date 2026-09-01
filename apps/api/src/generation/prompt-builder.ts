import { Injectable } from '@nestjs/common';
import { storeDefinitionInputSchema } from '@xandevo/shared';
import { zodToJsonSchema } from 'zod-to-json-schema';

import * as v1 from './prompts/store/v1';

export interface BuiltPrompt {
  system: string;
  user: string;
  promptVersion: string;
}

const VERSIONS = {
  [v1.PROMPT_VERSION]: v1,
} as const;

export const DEFAULT_PROMPT_VERSION = v1.PROMPT_VERSION;

@Injectable()
export class PromptBuilder {
  private readonly schemaJson = JSON.stringify(
    zodToJsonSchema(storeDefinitionInputSchema, { $refStrategy: 'none' }),
    null,
    0,
  );

  build(promptVersion: string, sanitizedPrompt: string): BuiltPrompt {
    const template = VERSIONS[promptVersion as keyof typeof VERSIONS];
    if (!template) throw new Error(`unknown prompt version "${promptVersion}"`);
    return {
      system: template.systemPrompt(this.schemaJson),
      user: template.userPrompt(sanitizedPrompt),
      promptVersion,
    };
  }
}
