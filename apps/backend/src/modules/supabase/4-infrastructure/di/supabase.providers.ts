import type { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@supabase/supabase-js';
import { LOGGER_CONTRACT } from '../../../../shared/1-domain/contracts/logger.contract';
import type { LoggerContract } from '../../../../shared/1-domain/contracts/logger.contract';
import type { Database } from '../../1-domain/types/database.types';
import { SUPABASE_CLIENT } from './supabase.tokens';

/**
 * Tipo do cliente Supabase com schema tipado
 */
export type TypedSupabaseClient = SupabaseClient<Database>;

/**
 * Providers do SupabaseModule
 */
export const supabaseProviders: Provider[] = [
  {
    provide: SUPABASE_CLIENT,
    useFactory: (configService: ConfigService, logger: LoggerContract): TypedSupabaseClient => {
      const supabaseUrl = configService.get<string>('supabase.url');
      const supabaseServiceRoleKey = configService.get<string>('supabase.serviceRoleKey');

      if (!supabaseUrl || !supabaseServiceRoleKey) {
        throw new Error('Variáveis de ambiente do Supabase não configuradas');
      }

      const client = createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
        global: {
          // Garante que o PostgREST receba o role correto (service_role) nas queries.
          headers: { Authorization: `Bearer ${supabaseServiceRoleKey}` },
        },
      });
      logger.debug('Cliente Supabase inicializado com tipagem forte');

      return client;
    },
    inject: [ConfigService, LOGGER_CONTRACT],
  },
];
