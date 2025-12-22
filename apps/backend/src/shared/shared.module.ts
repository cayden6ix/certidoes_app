import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { LOGGER_CONTRACT } from './1-domain/contracts/logger.contract';
import { envConfig, supabaseConfig } from './4-infrastructure/config/env.config';
import { PinoLoggerService } from './4-infrastructure/logger/pino-logger.service';

/**
 * Módulo compartilhado global
 * Provê serviços de infraestrutura para toda a aplicação
 */
@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [envConfig, supabaseConfig],
      envFilePath: ['.env', '.env.local'],
    }),
  ],
  providers: [
    {
      provide: LOGGER_CONTRACT,
      useClass: PinoLoggerService,
    },
  ],
  exports: [LOGGER_CONTRACT],
})
export class SharedModule {}
