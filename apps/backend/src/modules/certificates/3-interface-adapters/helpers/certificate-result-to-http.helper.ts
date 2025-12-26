import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import type { Result } from '../../../../shared/1-domain/types/result.type';
import { CertificateError } from '../../1-domain/errors/certificate-errors.enum';

/**
 * Helper para converter Result de certidões em resposta HTTP
 * Mapeia erros de domínio para exceções HTTP apropriadas
 */
export class CertificateResultToHttpHelper {
  /**
   * Converte Result em resposta HTTP
   * @param result - Result a converter
   * @returns Dados quando bem-sucedido
   * @throws HttpException apropriada em caso de erro
   */
  static handle<T>(result: Result<T>): T {
    if (result.success) {
      return result.data;
    }

    const error = result.error as CertificateError | undefined;

    // Mapeia erros de domínio para exceções HTTP
    switch (error) {
      // Erros 404 - Not Found
      case CertificateError.CERTIFICATE_NOT_FOUND:
        throw new NotFoundException(result.error);

      // Erros 403 - Forbidden
      case CertificateError.CERTIFICATE_ACCESS_DENIED:
      case CertificateError.CERTIFICATE_CANNOT_BE_EDITED:
        throw new ForbiddenException(result.error);

      // Erros 400 - Bad Request (validação)
      case CertificateError.INVALID_CERTIFICATE_TYPE:
      case CertificateError.INVALID_RECORD_NUMBER:
      case CertificateError.INVALID_PARTIES_NAME:
      case CertificateError.INVALID_PRIORITY:
      case CertificateError.INVALID_STATUS:
      case CertificateError.STATUS_VALIDATION_CONFIRMATION_REQUIRED:
      case CertificateError.STATUS_VALIDATION_REQUIRED_FIELD:
      case CertificateError.CERTIFICATE_ALREADY_COMPLETED:
      case CertificateError.CERTIFICATE_ALREADY_CANCELED:
        throw new BadRequestException(result.error);

      // Erros 500 - Internal Server Error (sistema)
      case CertificateError.DATABASE_ERROR:
      case CertificateError.UNEXPECTED_ERROR:
      default:
        throw new InternalServerErrorException(result.error);
    }
  }
}
