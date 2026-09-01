import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ThrottlerException } from '@nestjs/throttler';
import { StoreDefinitionError } from '@xandevo/shared';
import { type Response } from 'express';

import { AiGenerationError } from '../generation/generation.error';
import { type RequestWithId } from './request-id';

interface ErrorBody {
  error: {
    code: string;
    message: string;
    requestId: string;
    details?: { path: string; message: string }[];
  };
}

/** Maps every thrown error to the standard envelope (docs/api/api-contract.md). */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<RequestWithId>();
    const requestId = req.requestId ?? 'unknown';

    const { status, code, message, details } = this.classify(exception);

    if (status >= 500) {
      this.logger.error(
        JSON.stringify({ event: 'unhandled_error', requestId, code, message }),
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    const body: ErrorBody = {
      error: { code, message, requestId, ...(details ? { details } : {}) },
    };
    res.status(status).json(body);
  }

  private classify(exception: unknown): {
    status: number;
    code: string;
    message: string;
    details?: { path: string; message: string }[];
  } {
    if (exception instanceof AiGenerationError) {
      return exception.reason === 'invalid_output'
        ? {
            status: HttpStatus.UNPROCESSABLE_ENTITY,
            code: 'AI_GENERATION_FAILED',
            message: exception.message,
            details: exception.failureStage
              ? [{ path: exception.failureStage, message: 'validation failed at this stage' }]
              : undefined,
          }
        : {
            status: HttpStatus.SERVICE_UNAVAILABLE,
            code: 'AI_UNAVAILABLE',
            message: exception.message,
          };
    }

    if (exception instanceof StoreDefinitionError) {
      return {
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        code: 'VALIDATION_ERROR',
        message: exception.message,
        details: exception.issues,
      };
    }

    if (exception instanceof ThrottlerException) {
      return {
        status: HttpStatus.TOO_MANY_REQUESTS,
        code: 'RATE_LIMITED',
        message: 'too many requests',
      };
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const response = exception.getResponse();
      const body = (typeof response === 'string' ? {} : response) as {
        message?: string | string[];
        code?: string;
      };
      const message = body.message ?? (typeof response === 'string' ? response : exception.message);
      const details =
        Array.isArray(message) && status === HttpStatus.BAD_REQUEST
          ? message.map((m) => ({ path: '(body)', message: String(m) }))
          : undefined;
      return {
        status,
        code: body.code ?? CODE_BY_STATUS[status] ?? 'ERROR',
        message: Array.isArray(message) ? 'validation failed' : String(message),
        details,
      };
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      code: 'INTERNAL',
      message: 'internal error',
    };
  }
}

const CODE_BY_STATUS: Record<number, string> = {
  400: 'VALIDATION_ERROR',
  401: 'UNAUTHENTICATED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
  429: 'RATE_LIMITED',
};
