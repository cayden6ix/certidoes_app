import { registerAs } from '@nestjs/config';

/**
 * Configuração de ambiente da aplicação
 */
export const envConfig = registerAs('env', () => ({
  nodeEnv: process.env['NODE_ENV'] ?? 'development',
  port: parseInt(process.env['BACKEND_PORT'] ?? '3000', 10),
  logLevel: process.env['LOG_LEVEL'] ?? 'info',
}));

/**
 * Configuração do Supabase
 */
export const supabaseConfig = registerAs('supabase', () => ({
  url: process.env['SUPABASE_URL'] ?? '',
  anonKey: process.env['SUPABASE_ANON_KEY'] ?? '',
  serviceRoleKey: process.env['SUPABASE_SERVICE_ROLE_KEY'] ?? '',
}));
