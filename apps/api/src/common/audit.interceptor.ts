import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  Logger,
  type NestInterceptor,
} from '@nestjs/common';
import { type User } from '@prisma/client';
import { type Request, type Response } from 'express';
import { tap } from 'rxjs';

import { type RequestWithId } from './request-id';

const MUTATING = new Set(['POST', 'PATCH', 'PUT', 'DELETE']);

/**
 * Structured audit line for mutating requests. Never logs bodies, params, or PII
 * beyond `userId`.
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger('Audit');

  intercept(context: ExecutionContext, next: CallHandler) {
    const http = context.switchToHttp();
    const req = http.getRequest<Request & RequestWithId & { user?: User }>();
    if (!MUTATING.has(req.method)) return next.handle();

    const start = Date.now();
    return next.handle().pipe(
      tap({
        next: () => this.write(req, http.getResponse<Response>().statusCode, start),
        error: (err: { status?: number }) => this.write(req, err.status ?? 500, start),
      }),
    );
  }

  private write(req: Request & RequestWithId & { user?: User }, status: number, start: number) {
    this.logger.log(
      JSON.stringify({
        event: 'audit',
        requestId: req.requestId ?? 'unknown',
        userId: req.user?.id ?? null,
        method: req.method,
        route: req.route?.path ?? req.path,
        status,
        latencyMs: Date.now() - start,
      }),
    );
  }
}
