import { Module } from '@nestjs/common';

import { HealthController } from './3-interface-adapters/web-controllers/health.controller';

/**
 * Módulo de Health Check
 * Provê endpoint para verificação de saúde da API
 */
@Module({
  controllers: [HealthController],
})
export class HealthModule {}
