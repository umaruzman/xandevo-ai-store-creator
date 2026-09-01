import { type ZodIssue } from 'zod';

import { type FieldIssue } from './errors.js';

/** Flatten Zod issues into `{ path, message }` pairs for the error envelope. */
export function zodIssuesToFieldIssues(issues: ZodIssue[]): FieldIssue[] {
  return issues.map((issue) => ({
    path: issue.path.map(String).join('.') || '(root)',
    message: issue.message,
  }));
}
