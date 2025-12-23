import type { Result } from '../../../../shared/1-domain/types/result.type';
import { failure } from '../../../../shared/1-domain/types/result.type';
import type { LoggerContract } from '../../../../shared/1-domain/contracts/logger.contract';
import type { CertificateRepositoryContract } from '../../1-domain/contracts/certificate.repository.contract';
import type { CertificateEntity } from '../../1-domain/entities/certificate.entity';
import { CertificateError } from '../../1-domain/errors/certificate-errors.enum';

/**
 * DTO para requisição de busca de certidão
 */
export interface GetCertificateRequestDto {
  certificateId: string;
  userId: string;
  userRole: string;
}

/**
 * Use Case para obter uma certidão específica
 * Aplica regras de acesso baseadas no role do usuário
 */
export class GetCertificateUseCase {
  constructor(
    private readonly certificateRepository: CertificateRepositoryContract,
    private readonly logger: LoggerContract,
  ) {}

  /**
   * Executa a busca de uma certidão
   * @param request - DTO com ID da certidão e dados do usuário
   * @returns Result com a entidade ou erro
   */
  async execute(request: GetCertificateRequestDto): Promise<Result<CertificateEntity>> {
    this.logger.debug('Iniciando busca de certidão', {
      certificateId: request.certificateId,
      userId: request.userId,
      userRole: request.userRole,
    });

    // Busca certidão
    const result = await this.certificateRepository.findById(request.certificateId);

    if (!result.success) {
      this.logger.warn('Certidão não encontrada', {
        certificateId: request.certificateId,
        userId: request.userId,
      });
      return result;
    }

    const certificate = result.data;

    // Verifica permissão de acesso
    // Cliente só pode ver suas próprias certidões
    // Admin pode ver todas
    if (request.userRole !== 'admin' && !certificate.isOwnedBy(request.userId)) {
      this.logger.warn('Acesso negado à certidão', {
        certificateId: request.certificateId,
        userId: request.userId,
        ownerId: certificate.userId,
      });
      return failure(CertificateError.CERTIFICATE_ACCESS_DENIED);
    }

    this.logger.debug('Certidão encontrada', {
      certificateId: certificate.id,
      userId: request.userId,
    });

    return result;
  }
}
