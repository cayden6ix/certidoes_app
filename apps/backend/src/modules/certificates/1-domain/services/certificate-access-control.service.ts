import type { CertificateEntity } from '../entities/certificate.entity';
import type { UpdateCertificateRequestDto } from '../../2-application/dto/update-certificate-request.dto';

/**
 * Tipo para campos permitidos para cliente
 * Cliente não pode alterar: status, cost, additionalCost, orderNumber, paymentDate, paymentTypeId
 */
export interface ClientAllowedFields {
  certificateType?: string;
  recordNumber?: string;
  partiesName?: string;
  notes?: string;
  priority?: 'normal' | 'urgent';
}

/**
 * Tipo para campos permitidos para admin (todos os campos)
 */
export type AdminAllowedFields = UpdateCertificateRequestDto['data'];

/**
 * Resultado da verificação de acesso
 */
export interface AccessCheckResult {
  canAccess: boolean;
  canEdit: boolean;
  isAdmin: boolean;
  isOwner: boolean;
}

/**
 * Serviço de domínio puro para controle de acesso a certidões
 * Encapsula regras de permissão e filtragem de campos
 * Não possui dependências de infraestrutura (Clean Architecture)
 */
export class CertificateAccessControlService {
  /**
   * Verifica permissões de acesso do usuário à certidão
   * @param certificate - Certidão a ser verificada
   * @param userId - ID do usuário solicitante
   * @param userRole - Role do usuário (client ou admin)
   * @returns Resultado detalhado das verificações de acesso
   */
  checkAccess(
    certificate: CertificateEntity,
    userId: string,
    userRole: 'client' | 'admin',
  ): AccessCheckResult {
    const isAdmin = userRole === 'admin';
    const isOwner = certificate.isOwnedBy(userId);
    const canAccess = isAdmin || isOwner;
    const canEdit = canAccess && (isAdmin || certificate.canBeEdited());

    return {
      canAccess,
      canEdit,
      isAdmin,
      isOwner,
    };
  }

  /**
   * Verifica se o usuário pode acessar a certidão
   * @param certificate - Certidão a ser verificada
   * @param userId - ID do usuário solicitante
   * @param userRole - Role do usuário
   */
  canUserAccess(
    certificate: CertificateEntity,
    userId: string,
    userRole: 'client' | 'admin',
  ): boolean {
    return this.checkAccess(certificate, userId, userRole).canAccess;
  }

  /**
   * Verifica se o usuário pode editar a certidão
   * @param certificate - Certidão a ser verificada
   * @param userId - ID do usuário solicitante
   * @param userRole - Role do usuário
   */
  canUserEdit(
    certificate: CertificateEntity,
    userId: string,
    userRole: 'client' | 'admin',
  ): boolean {
    return this.checkAccess(certificate, userId, userRole).canEdit;
  }

  /**
   * Filtra campos permitidos baseado no role do usuário
   * Cliente não pode alterar: status, cost, additionalCost, orderNumber, paymentDate, paymentTypeId
   * @param data - Dados de atualização recebidos
   * @param userRole - Role do usuário
   * @returns Dados filtrados conforme permissões
   */
  filterFieldsByRole(
    data: UpdateCertificateRequestDto['data'],
    userRole: 'client' | 'admin',
  ): ClientAllowedFields | AdminAllowedFields {
    if (userRole === 'admin') {
      return data;
    }

    // Cliente só pode editar campos específicos
    return {
      certificateType: data.certificateType,
      recordNumber: data.recordNumber,
      partiesName: data.partiesName,
      notes: data.notes,
      priority: data.priority,
    };
  }

  /**
   * Remove campos undefined e strings vazias dos dados de atualização
   * @param data - Dados a serem limpos
   * @returns Dados limpos sem undefined e strings vazias
   */
  cleanUpdateData<T extends object>(data: T): Partial<T> {
    const cleanData: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(data)) {
      // Ignora undefined
      if (value === undefined) {
        continue;
      }

      // Ignora strings vazias
      if (typeof value === 'string' && value.trim() === '') {
        continue;
      }

      cleanData[key] = value;
    }

    return cleanData as Partial<T>;
  }
}
