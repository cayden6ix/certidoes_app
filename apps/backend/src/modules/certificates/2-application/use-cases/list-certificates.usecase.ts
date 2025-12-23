import type { Result } from '../../../../shared/1-domain/types/result.type';
import type { LoggerContract } from '../../../../shared/1-domain/contracts/logger.contract';
import type {
  CertificateRepositoryContract,
  PaginatedCertificates,
} from '../../1-domain/contracts/certificate.repository.contract';
import type { ListCertificatesRequestDto } from '../dto/list-certificates-request.dto';

/**
 * Use Case para listagem de certidões
 * Aplica regras de acesso baseadas no role do usuário
 */
export class ListCertificatesUseCase {
  constructor(
    private readonly certificateRepository: CertificateRepositoryContract,
    private readonly logger: LoggerContract,
  ) {}

  /**
   * Executa a listagem de certidões
   * @param request - DTO com filtros e dados do usuário
   * @returns Result com lista paginada de certidões
   */
  async execute(request: ListCertificatesRequestDto): Promise<Result<PaginatedCertificates>> {
    this.logger.debug('Iniciando listagem de certidões', {
      userId: request.userId,
      userRole: request.userRole,
      filters: request.filters,
    });

    // Define filtro de userId baseado no role
    // Cliente só vê suas próprias certidões
    // Admin vê todas
    const userIdFilter = request.userRole === 'admin' ? undefined : request.userId;

    const result = await this.certificateRepository.findAll({
      userId: userIdFilter,
      search: request.filters.search,
      from: request.filters.from,
      to: request.filters.to,
      status: request.filters.status,
      priority: request.filters.priority,
      limit: request.filters.limit ?? 50,
      offset: request.filters.offset ?? 0,
    });

    if (!result.success) {
      this.logger.error('Erro ao listar certidões', {
        userId: request.userId,
        error: result.error,
      });
      return result;
    }

    this.logger.debug('Listagem de certidões concluída', {
      userId: request.userId,
      total: result.data.total,
      returned: result.data.data.length,
    });

    return result;
  }
}
