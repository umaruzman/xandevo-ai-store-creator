import { type NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';

import { requestIdMiddleware } from './common/request-id';

/**
 * App configuration applied by both `main.ts` and the e2e tests, so end-to-end
 * specs exercise the real middleware / body-parser wiring.
 *
 * Note: NestJS/platform-express already registers a JSON body parser — do NOT
 * add another (`app.use(json(...))`), or POST bodies get read twice and 500.
 * Adjust the built-in one via `useBodyParser`.
 *
 * CORS stays OFF: the web app calls this API only server-side (RSC / Server
 * Actions / BFF route handlers), so the browser never needs cross-origin access.
 */
export function configureApp(app: NestExpressApplication): void {
  app.use(requestIdMiddleware);
  app.use(
    helmet({
      // This is a JSON API — no HTML, so a strict, minimal CSP is enough.
      contentSecurityPolicy: {
        directives: { 'default-src': ["'none'"], 'frame-ancestors': ["'none'"] },
      },
      crossOriginResourcePolicy: { policy: 'same-site' },
    }),
  );
  app.useBodyParser('json', { limit: '256kb' });
  app.enableShutdownHooks();
}
