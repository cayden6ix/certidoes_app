import {
  UnauthorizedException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import type { Result } from '../../../../shared/1-domain/types/result.type';

/**
 * Helper para converter Result em resposta HTTP
 * Lança HttpException apropriada quando há erro
 * Retorna dados quando há sucesso
 */
export class ResultToHttpHelper {
  /**
   * Converte Result em resposta HTTP
   * Usa UnauthorizedException para erros de autenticação
   * @param result - Result a converter
   * @returns Dados quando bem-sucedido
   * @throws UnauthorizedException em caso de erro
   */
  static handleAuth<T>(result: Result<T>): T {
    if (result.success) {
      return result.data;
    }

    throw new UnauthorizedException(result.error);
  }

  /**
   * Converte Result em resposta HTTP com tipo de erro configurável
   * @param result - Result a converter
   * @param errorType - Tipo de erro: 'auth', 'validation' ou 'server'
   * @returns Dados quando bem-sucedido
   * @throws HttpException apropriada em caso de erro
   */
  static handle<T>(
    result: Result<T>,
    errorType: 'auth' | 'validation' | 'server' = 'auth',
  ): T {
    if (result.success) {
      return result.data;
    }

    switch (errorType) {
      case 'validation':
        throw new BadRequestException(result.error);

      case 'server':
        throw new InternalServerErrorException(result.error);

      case 'auth':
      default:
        throw new UnauthorizedException(result.error);
    }
  }
}
