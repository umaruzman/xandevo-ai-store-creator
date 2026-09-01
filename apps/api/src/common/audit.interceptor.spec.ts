import { type CallHandler, type ExecutionContext, Logger } from '@nestjs/common';
import { of } from 'rxjs';

import { AuditInterceptor } from './audit.interceptor';

function ctx(method: string): ExecutionContext {
  const req = {
    method,
    path: '/stores',
    route: { path: '/stores' },
    requestId: 'req-1',
    user: { id: 'u1' },
  };
  return {
    switchToHttp: () => ({
      getRequest: () => req,
      getResponse: () => ({ statusCode: 201 }),
    }),
  } as unknown as ExecutionContext;
}

const handler = (): CallHandler => ({ handle: () => of({ ok: true }) });

describe('AuditInterceptor', () => {
  let logSpy: jest.SpyInstance;
  beforeEach(() => {
    logSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
  });
  afterEach(() => logSpy.mockRestore());

  it('logs a structured audit line for a mutating request', (done) => {
    new AuditInterceptor().intercept(ctx('POST'), handler()).subscribe(() => {
      expect(logSpy).toHaveBeenCalledTimes(1);
      const payload = JSON.parse(logSpy.mock.calls[0]![0] as string);
      expect(payload).toMatchObject({
        event: 'audit',
        method: 'POST',
        route: '/stores',
        status: 201,
        userId: 'u1',
        requestId: 'req-1',
      });
      expect(payload).not.toHaveProperty('body');
      done();
    });
  });

  it('does not log GET requests', (done) => {
    new AuditInterceptor().intercept(ctx('GET'), handler()).subscribe(() => {
      expect(logSpy).not.toHaveBeenCalled();
      done();
    });
  });
});
