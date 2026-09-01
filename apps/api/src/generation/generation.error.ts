/** Terminal failure of `POST /generate` after retries. Mapped to HTTP by the filter. */
export class AiGenerationError extends Error {
  constructor(
    readonly reason: 'provider_unavailable' | 'invalid_output',
    message: string,
    readonly failureStage?: string,
  ) {
    super(message);
    this.name = 'AiGenerationError';
  }
}
