import 'reflect-metadata';

import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { cors: false });
  const port = Number(process.env.API_PORT ?? 4000);
  await app.listen(port);
  console.log(`[xandevo/api] listening on http://localhost:${port}`);
}

void bootstrap();
