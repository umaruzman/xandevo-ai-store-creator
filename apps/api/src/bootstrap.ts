import { type NestExpressApplication } from '@nestjs/platform-express';

import { requestIdMiddleware } from './common/request-id';

/**
 * App configuration applied by both `main.ts` and the e2e tests, so end-to-end
 * specs exercise the real middleware / body-parser wiring.
 *
 * Note: NestJS/platform-express already registers a JSON body parser — do NOT
 * add another (`app.use(json(...))`), or POST bodies get read twice and 500.
 * Adjust the built-in one via `useBodyParser`.
 */
export function configureApp(app: NestExpressApplication): void {
  app.use(requestIdMiddleware);
  app.useBodyParser('json', { limit: '256kb' });
  app.enableShutdownHooks();
}
