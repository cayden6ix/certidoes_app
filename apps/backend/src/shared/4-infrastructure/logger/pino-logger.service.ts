import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import pino from 'pino';

import type { LoggerContract } from '../../1-domain/contracts/logger.contract';
import type { EnvConfiguration } from '../config/env.config';

/**
 * Chaves de dados sensíveis que devem ser mascarados completamente
 */
const SENSITIVE_KEYS = ['password', 'senha', 'secret', 'apiKey', 'api_key'];

/**
 * Chaves de tokens que devem mostrar apenas prefixo/sufixo
 */
const TOKEN_KEYS = ['token', 'accessToken', 'refreshToken', 'jwt'];

/**
 * Chaves de dados pessoais que devem ser parcialmente mascarados
 */
const PERSONAL_KEYS = ['cpf', 'email'];

/**
 * Implementação do LoggerContract usando Pino
 * Logs estruturados com contexto e mascaramento de dados sensíveis
 */
@Injectable()
export class PinoLoggerService implements LoggerContract {
  private readonly logger: pino.Logger;

  constructor(
    @Inject(ConfigService)
    configService: ConfigService,
  ) {
    const envConfig = configService.get<EnvConfiguration>('env');
    const logLevel = envConfig?.logLevel ?? 'info';
    const nodeEnv = envConfig?.nodeEnv ?? 'development';

    this.logger = pino({
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

  info(message: string, context?: Record<string, unknown>): void {
    this.logger.info(this.maskSensitiveData(context), message);
  }

  warn(message: string, context?: Record<string, unknown>): void {
    this.logger.warn(this.maskSensitiveData(context), message);
  }

  error(message: string, context?: Record<string, unknown>): void {
    this.logger.error(this.maskSensitiveData(context), message);
  }

  debug(message: string, context?: Record<string, unknown>): void {
    this.logger.debug(this.maskSensitiveData(context), message);
  }

  /**
   * Mascara dados sensíveis conforme CLAUDE.md
   * - Senhas: mascaradas completamente
   * - Tokens: apenas primeiros/últimos caracteres
   * - CPF/Email: parcialmente mascarados
   * - Chaves de API: mascaradas completamente
   */
  private maskSensitiveData(
    context?: Record<string, unknown>,
  ): Record<string, unknown> | undefined {
    if (!context) {
      return undefined;
    }

    const masked: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(context)) {
      const lowerKey = key.toLowerCase();

      if (this.isSensitiveKey(lowerKey)) {
        masked[key] = '********';
      } else if (this.isTokenKey(lowerKey)) {
        masked[key] = this.maskToken(value);
      } else if (this.isPersonalKey(lowerKey)) {
        masked[key] = typeof value === 'string' ? this.maskPersonalData(key, value) : value;
      } else {
        masked[key] = value;
      }
    }

    return masked;
  }

  private isSensitiveKey(key: string): boolean {
    return SENSITIVE_KEYS.some((k) => key.includes(k));
  }

  private isTokenKey(key: string): boolean {
    return TOKEN_KEYS.some((k) => key.includes(k));
  }

  private isPersonalKey(key: string): boolean {
    return PERSONAL_KEYS.some((k) => key.includes(k));
  }

  private maskToken(value: unknown): string {
    if (typeof value === 'string' && value.length > 10) {
      return `${value.slice(0, 4)}...${value.slice(-4)}`;
    }
    return '****';
  }

  private maskPersonalData(key: string, value: string): string {
    if (key.toLowerCase() === 'cpf' && value.length >= 11) {
      return `${value.slice(0, 3)}.***.***-${value.slice(-2)}`;
    }

    if (key.toLowerCase() === 'email' && value.includes('@')) {
      const [local, domain] = value.split('@');
      if (local && domain) {
        const maskedLocal = local.length > 2 ? `${local.slice(0, 2)}***` : '***';
        return `${maskedLocal}@${domain}`;
      }
    }

    return value;
  }
}
