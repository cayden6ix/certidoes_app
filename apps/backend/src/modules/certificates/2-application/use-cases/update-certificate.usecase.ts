import type { Result } from '../../../../shared/1-domain/types/result.type';
import { failure } from '../../../../shared/1-domain/types/result.type';
import type { LoggerContract } from '../../../../shared/1-domain/contracts/logger.contract';
import type { CertificateRepositoryContract } from '../../1-domain/contracts/certificate.repository.contract';
import type { CertificateEntity } from '../../1-domain/entities/certificate.entity';
import { CertificateError } from '../../1-domain/errors/certificate-errors.enum';
import type { UpdateCertificateRequestDto } from '../dto/update-certificate-request.dto';

/**
 * Use Case para atualização de certidão
 * Aplica regras de acesso e restrições de campos baseadas no role
 */
export class UpdateCertificateUseCase {
  constructor(
    private readonly certificateRepository: CertificateRepositoryContract,
    private readonly logger: LoggerContract,
  ) {}

  /**
   * Executa a atualização de uma certidão
   * @param request - DTO com dados de atualização
   * @returns Result com a entidade atualizada ou erro
   */
  async execute(request: UpdateCertificateRequestDto): Promise<Result<CertificateEntity>> {
    this.logger.debug('Iniciando atualização de certidão', {
      certificateId: request.certificateId,
      userId: request.userId,
      userRole: request.userRole,
    });

    // Busca certidão existente
    const findResult = await this.certificateRepository.findById(request.certificateId);

    if (!findResult.success) {
      this.logger.warn('Certidão não encontrada para atualização', {
        certificateId: request.certificateId,
        userId: request.userId,
      });
      return findResult;
    }

    const certificate = findResult.data;

    // Verifica permissão de acesso
    const isAdmin = request.userRole === 'admin';
    const isOwner = certificate.isOwnedBy(request.userId);

    if (!isAdmin && !isOwner) {
      this.logger.warn('Acesso negado para atualização de certidão', {
        certificateId: request.certificateId,
        userId: request.userId,
        ownerId: certificate.userId,
      });
      return failure(CertificateError.CERTIFICATE_ACCESS_DENIED);
    }

    // Verifica se pode ser editada
    if (!certificate.canBeEdited() && !isAdmin) {
      this.logger.warn('Certidão não pode ser editada', {
        certificateId: request.certificateId,
        status: certificate.status.getValue(),
      });
      return failure(CertificateError.CERTIFICATE_CANNOT_BE_EDITED);
    }

    // Filtra campos que cliente NÃO pode editar
    // Cliente não pode alterar: status, cost, additionalCost, orderNumber, paymentDate
    const allowedData = isAdmin
      ? request.data
      : {
          certificateType: request.data.certificateType,
          recordNumber: request.data.recordNumber,
          partiesName: request.data.partiesName,
          notes: request.data.notes,
          priority: request.data.priority,
        };

    // Remove campos undefined
    const cleanData = Object.fromEntries(
      Object.entries(allowedData).filter(([, value]) => value !== undefined),
    );

    if (Object.keys(cleanData).length === 0) {
      this.logger.debug('Nenhum campo para atualizar', {
        certificateId: request.certificateId,
      });
      return findResult; // Retorna a certidão sem alterações
    }

    // Atualiza no repositório
    const updateResult = await this.certificateRepository.update(request.certificateId, cleanData);

    if (!updateResult.success) {
      this.logger.error('Erro ao atualizar certidão', {
        certificateId: request.certificateId,
        error: updateResult.error,
      });
      return updateResult;
    }

    this.logger.info('Certidão atualizada com sucesso', {
      certificateId: request.certificateId,
      userId: request.userId,
      updatedFields: Object.keys(cleanData),
    });

    return updateResult;
  }
}
