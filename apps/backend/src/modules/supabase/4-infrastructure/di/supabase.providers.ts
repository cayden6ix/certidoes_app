import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';
import { LOGGER_CONTRACT } from '../../../../shared/1-domain/contracts/logger.contract';
import type { LoggerContract } from '../../../../shared/1-domain/contracts/logger.contract';
import { SUPABASE_CLIENT } from './supabase.tokens';

/**
 * Providers do SupabaseModule
 */
export const supabaseProviders: Provider[] = [
  {
    provide: SUPABASE_CLIENT,
    useFactory: (
      configService: ConfigService,
      logger: LoggerContract,
    ): SupabaseClient => {
      const supabaseUrl = configService.get<string>('supabase.url');
      const supabaseServiceRoleKey = configService.get<string>('supabase.serviceRoleKey');

      if (!supabaseUrl || !supabaseServiceRoleKey) {
        throw new Error('Variáveis de ambiente do Supabase não configuradas');
      }

      const client = createClient(supabaseUrl, supabaseServiceRoleKey);
      logger.debug('Cliente Supabase inicializado');

      return client;
    },
    inject: [ConfigService, LOGGER_CONTRACT],
  },
];
