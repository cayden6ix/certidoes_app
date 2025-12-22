import { Module } from '@nestjs/common';

import { HealthModule } from './modules/health/health.module';
import { SharedModule } from './shared/shared.module';

/**
 * Módulo raiz da aplicação
 * Importa todos os módulos de funcionalidade
 */
@Module({
  imports: [SharedModule, HealthModule],
})
export class AppModule {}
