'use server';

import type { GenerateStoreResponse } from '@xandevo/shared';

import { ApiError } from '@/lib/api';
import { apiClient } from '@/lib/api-client';

export type GenerateResult =
  | { ok: true; data: GenerateStoreResponse }
  | { ok: false; error: string };

/** `useActionState` action: prompt -> generated Store Definition, or a friendly error. */
export async function generateStoreAction(
  _prev: GenerateResult | null,
  formData: FormData,
): Promise<GenerateResult> {
  const prompt = String(formData.get('prompt') ?? '').trim();
  if (prompt.length < 10) {
    return { ok: false, error: 'Please describe your store in at least 10 characters.' };
  }
  if (prompt.length > 1000) {
    return { ok: false, error: 'Please keep the description under 1000 characters.' };
  }

  try {
    const data = await apiClient.generateStore(prompt);
    return { ok: true, data };
  } catch (err) {
    if (err instanceof ApiError) return { ok: false, error: friendly(err) };
    return { ok: false, error: 'Something went wrong. Please try again.' };
  }
}

function friendly(err: ApiError): string {
  switch (err.code) {
    case 'AI_GENERATION_FAILED':
      return "The AI couldn't produce a valid store from that description. Try rephrasing or adding detail.";
    case 'AI_UNAVAILABLE':
      return 'The AI service is busy right now. Please try again in a moment.';
    case 'RATE_LIMITED':
      return "You're generating a lot right now — wait a minute and try again.";
    case 'VALIDATION_ERROR':
      return err.message;
    default:
      return 'Generation failed. Please try again.';
  }
}
