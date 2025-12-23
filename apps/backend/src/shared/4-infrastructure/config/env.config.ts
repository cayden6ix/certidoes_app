import { registerAs } from '@nestjs/config';

/**
 * Erro lançado quando uma variável de ambiente obrigatória está ausente
 */
class MissingEnvironmentVariableError extends Error {
  constructor(variableName: string) {
    super(`Variável de ambiente obrigatória não encontrada: ${variableName}`);
    this.name = 'MissingEnvironmentVariableError';
  }
}

/**
 * Obtém variável de ambiente obrigatória
 * Lança erro se não estiver definida
 */
function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (value === undefined || value === '') {
    throw new MissingEnvironmentVariableError(name);
  }
  return value;
}

/**
 * Obtém variável de ambiente opcional com valor padrão tipado
 */
function getOptionalEnv(name: string, defaultValue: string): string {
  const value = process.env[name];
  if (value === undefined || value === '') {
    return defaultValue;
  }
  return value;
}

/**
 * Tipos válidos para ambiente de execução
 */
type NodeEnvironment = 'development' | 'production' | 'test';

/**
 * Tipos válidos para nível de log
 */
type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';

/**
 * Interface de configuração do ambiente
 */
export interface EnvConfiguration {
  nodeEnv: NodeEnvironment;
  port: number;
  logLevel: LogLevel;
  frontendUrl: string;
}

/**
 * Interface de configuração do Supabase
 */
export interface SupabaseConfiguration {
  url: string;
  anonKey: string;
  serviceRoleKey: string;
}

/**
 * Valida e converte o ambiente de execução
 */
function parseNodeEnv(value: string): NodeEnvironment {
  const validEnvs: NodeEnvironment[] = ['development', 'production', 'test'];
  if (validEnvs.includes(value as NodeEnvironment)) {
    return value as NodeEnvironment;
  }
  return 'development';
}

/**
 * Valida e converte o nível de log
 */
function parseLogLevel(value: string): LogLevel {
  const validLevels: LogLevel[] = ['trace', 'debug', 'info', 'warn', 'error', 'fatal'];
  if (validLevels.includes(value as LogLevel)) {
    return value as LogLevel;
  }
  return 'info';
}

/**
 * Valida e converte porta para número
 */
function parsePort(value: string): number {
  const port = parseInt(value, 10);
  if (isNaN(port) || port < 1 || port > 65535) {
    throw new Error(`Porta inválida: ${value}. Deve ser um número entre 1 e 65535.`);
  }
  return port;
}

/**
 * Configuração de ambiente da aplicação
 * Usa valores padrão seguros para desenvolvimento
 */
export const envConfig = registerAs('env', (): EnvConfiguration => ({
  nodeEnv: parseNodeEnv(getOptionalEnv('NODE_ENV', 'development')),
  port: parsePort(getOptionalEnv('BACKEND_PORT', '3000')),
  logLevel: parseLogLevel(getOptionalEnv('LOG_LEVEL', 'info')),
  frontendUrl: getOptionalEnv('FRONTEND_URL', 'http://localhost:5173'),
}));

/**
 * Configuração do Supabase
 * Todas as variáveis são OBRIGATÓRIAS - a aplicação não inicia sem elas
 */
export const supabaseConfig = registerAs('supabase', (): SupabaseConfiguration => ({
  url: getRequiredEnv('SUPABASE_URL'),
  anonKey: getRequiredEnv('SUPABASE_ANON_KEY'),
  serviceRoleKey: getRequiredEnv('SUPABASE_SERVICE_ROLE_KEY'),
}));
