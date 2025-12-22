import { Injectable } from '@nestjs/common';
import pino from 'pino';

import type { LoggerContract } from '../../1-domain/contracts/logger.contract';

/**
 * Implementação do LoggerContract usando Pino
 * Logs estruturados com contexto
 */
@Injectable()
export class PinoLoggerService implements LoggerContract {
  private readonly logger: pino.Logger;

  constructor() {
    this.logger = pino({
      level: process.env['LOG_LEVEL'] ?? 'info',
      transport:
        process.env['NODE_ENV'] !== 'production'
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
    if (!context) return undefined;

    const sensitiveKeys = ['password', 'senha', 'secret', 'apiKey', 'api_key'];
    const tokenKeys = ['token', 'accessToken', 'refreshToken', 'jwt'];
    const personalKeys = ['cpf', 'email'];

    const masked: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(context)) {
      const lowerKey = key.toLowerCase();

      if (sensitiveKeys.some((k) => lowerKey.includes(k))) {
        masked[key] = '********';
      } else if (tokenKeys.some((k) => lowerKey.includes(k))) {
        if (typeof value === 'string' && value.length > 10) {
          masked[key] = `${value.slice(0, 4)}...${value.slice(-4)}`;
        } else {
          masked[key] = '****';
        }
      } else if (personalKeys.some((k) => lowerKey.includes(k))) {
        if (typeof value === 'string') {
          masked[key] = this.maskPersonalData(key, value);
        } else {
          masked[key] = value;
        }
      } else {
        masked[key] = value;
      }
    }

    return masked;
  }

  private maskPersonalData(key: string, value: string): string {
    if (key.toLowerCase() === 'cpf' && value.length >= 11) {
      return `${value.slice(0, 3)}.***.***-${value.slice(-2)}`;
    }
    if (key.toLowerCase() === 'email' && value.includes('@')) {
      const [local, domain] = value.split('@');
      if (local && domain) {
        const maskedLocal =
          local.length > 2 ? `${local.slice(0, 2)}***` : '***';
        return `${maskedLocal}@${domain}`;
      }
    }
    return value;
  }
}
