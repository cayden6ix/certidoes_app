import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { NestExpressApplication } from '@nestjs/platform-express';
import pino from 'pino';

import { AppModule } from './app.module';
import type { EnvConfiguration, SupabaseConfiguration } from './shared/4-infrastructure/config/env.config';

/**
 * Cria instância do logger Pino para bootstrap
 * Usa configuração baseada no ambiente
 */
function createBootstrapLogger(logLevel: string, nodeEnv: string): pino.Logger {
  return pino({
    level: logLevel,
    transport:
      nodeEnv !== 'production'
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
}

/**
 * Bootstrap da aplicação NestJS
 * A aplicação falha rápido se variáveis obrigatórias não estiverem configuradas
 */
async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });

  const configService = app.get(ConfigService);

  // Obtém configurações tipadas - falha se não estiverem definidas
  const envConfiguration = configService.get<EnvConfiguration>('env');
  const supabaseConfiguration = configService.get<SupabaseConfiguration>('supabase');

  if (!envConfiguration) {
    throw new Error('Configuração de ambiente não carregada corretamente');
  }

  if (!supabaseConfiguration) {
    throw new Error('Configuração do Supabase não carregada corretamente');
  }

  const logger = createBootstrapLogger(envConfiguration.logLevel, envConfiguration.nodeEnv);

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

  // CORS configurado via variável de ambiente
  app.enableCors({
    origin: envConfiguration.frontendUrl,
    credentials: true,
  });

  await app.listen(envConfiguration.port);

  logger.info(`Aplicação iniciada na porta ${envConfiguration.port}`);
  logger.info(`Ambiente: ${envConfiguration.nodeEnv}`);
  logger.info(`Health check disponível em: http://localhost:${envConfiguration.port}/api/health`);
}

/**
 * Inicializa a aplicação
 * Erros de inicialização são logados via pino e a aplicação termina com código de erro
 */
const bootstrapLogger = pino({ level: 'error' });

bootstrap().catch((error: unknown) => {
  const errorMessage = error instanceof Error ? error.message : 'Erro de inicialização desconhecido';
  const errorStack = error instanceof Error ? error.stack : undefined;

  bootstrapLogger.fatal({ error: errorMessage, stack: errorStack }, 'Falha ao iniciar a aplicação');
  process.exit(1);
});
