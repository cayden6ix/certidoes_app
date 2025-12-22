import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import pino from 'pino';

import { AppModule } from './app.module';

/**
 * Bootstrap da aplicação NestJS
 */
async function bootstrap(): Promise<void> {
  const logger = pino({
    level: process.env['LOG_LEVEL'] ?? 'info',
    transport:
      process.env['NODE_ENV'] !== 'production'
        ? {
            target: 'pino-pretty',
            options: {
              colorize: true,
              translateTime: 'SYS:standard',
              ignore: 'pid,hostname',
            },
          }
        : undefined,
  });

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });

  // Prefixo global para todas as rotas
  app.setGlobalPrefix('api');

  // Validação global com class-validator
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // CORS para desenvolvimento
  app.enableCors({
    origin: process.env['FRONTEND_URL'] ?? 'http://localhost:5173',
    credentials: true,
  });

  const port = parseInt(process.env['BACKEND_PORT'] ?? '3000', 10);

  await app.listen(port);

  logger.info(`Aplicação iniciada na porta ${port}`);
  logger.info(`Ambiente: ${process.env['NODE_ENV'] ?? 'development'}`);
  logger.info(`Health check disponível em: http://localhost:${port}/api/health`);
}

bootstrap().catch((error: unknown) => {
  const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
  // eslint-disable-next-line no-console
  console.error('Falha ao iniciar a aplicação:', errorMessage);
  process.exit(1);
});
