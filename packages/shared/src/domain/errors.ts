/** Stage of the Store Definition pipeline that rejected the input. */
export type PipelineStage = 'parse' | 'schema' | 'business' | 'sanitize' | 'normalize';

export interface FieldIssue {
  path: string;
  message: string;
}

/**
 * Thrown when untrusted input (AI output, or a client-supplied definition) fails
 * any stage of the pipeline. Carries the stage and structured issues; never the
 * raw input.
 */
export class StoreDefinitionError extends Error {
  constructor(
    readonly stage: PipelineStage,
    message: string,
    readonly issues: FieldIssue[] = [],
  ) {
    super(message);
    this.name = 'StoreDefinitionError';
  }

  static parse(message: string): StoreDefinitionError {
    return new StoreDefinitionError('parse', message);
  }

  static schema(issues: FieldIssue[]): StoreDefinitionError {
    return new StoreDefinitionError('schema', 'Store Definition failed schema validation', issues);
  }

  static business(issues: FieldIssue[]): StoreDefinitionError {
    return new StoreDefinitionError(
      'business',
      'Store Definition failed business validation',
      issues,
    );
  }
}
