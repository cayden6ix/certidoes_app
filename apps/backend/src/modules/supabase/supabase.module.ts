import { Module } from '@nestjs/common';
import { supabaseProviders } from './4-infrastructure/di/supabase.providers';
import { SUPABASE_CLIENT } from './4-infrastructure/di/supabase.tokens';

/**
 * Módulo dedicado ao Supabase
 * Centraliza a criação do cliente com serviceRoleKey
 */
@Module({
  providers: [...supabaseProviders],
  exports: [SUPABASE_CLIENT],
})
export class SupabaseModule {}
