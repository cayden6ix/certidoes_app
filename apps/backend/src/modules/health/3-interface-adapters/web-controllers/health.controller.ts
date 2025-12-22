import { Controller, Get, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import {
  LOGGER_CONTRACT,
  type LoggerContract,
} from '../../../../shared/1-domain/contracts/logger.contract';

/**
 * Resposta do endpoint de health check
 */
interface HealthResponse {
  status: string;
  env: string;
  timestamp: string;
}

/**
 * Controller para verificação de saúde da API
 */
@Controller('health')
export class HealthController {
  constructor(
    private readonly configService: ConfigService,
    @Inject(LOGGER_CONTRACT)
    private readonly logger: LoggerContract,
  ) {}

  /**
   * GET /api/health
   * Retorna o status da aplicação
   */
  @Get()
  check(): HealthResponse {
    const env = this.configService.get<string>('env.nodeEnv') ?? 'development';

    this.logger.debug('Health check realizado', { env });

    return {
      status: 'ok',
      env,
      timestamp: new Date().toISOString(),
    };
  }
}
