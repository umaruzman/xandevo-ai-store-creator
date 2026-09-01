import { randomUUID } from 'node:crypto';

import { type NextFunction, type Request, type Response } from 'express';

export interface RequestWithId extends Request {
  requestId: string;
}

const VALID = /^[\w-]{1,64}$/;

/**
 * Functional Express middleware (applied in `configureApp`, not via Nest's
 * `MiddlewareConsumer` — `forRoutes('*')` is broken under Express 5). Assigns a
 * request id and echoes it as `x-request-id`.
 */
export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const incoming = req.headers['x-request-id'];
  const id = typeof incoming === 'string' && VALID.test(incoming) ? incoming : randomUUID();
  (req as RequestWithId).requestId = id;
  res.setHeader('x-request-id', id);
  next();
}
