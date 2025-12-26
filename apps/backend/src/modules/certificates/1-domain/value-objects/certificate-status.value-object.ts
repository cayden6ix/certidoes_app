import type { Result } from '../../../../shared/1-domain/types/result.type';
import { success, failure } from '../../../../shared/1-domain/types/result.type';
import type { CertificateStatusInfo } from '@shared/types';

/**
 * Dados necessários para criar um CertificateStatusValueObject
 */
export interface CertificateStatusData {
  id: string;
  name: string;
  displayName: string;
  color: string;
  canEditCertificate: boolean;
  isFinal: boolean;
}

/**
 * Value Object para status de certidão
 * Encapsula os dados do status vindos da tabela certificate_status
 */
export class CertificateStatusValueObject {
  private readonly id: string;
  private readonly name: string;
  private readonly displayName: string;
  private readonly color: string;
  private readonly _canEditCertificate: boolean;
  private readonly _isFinal: boolean;

  private constructor(data: CertificateStatusData) {
    this.id = data.id;
    this.name = data.name;
    this.displayName = data.displayName;
    this.color = data.color;
    this._canEditCertificate = data.canEditCertificate;
    this._isFinal = data.isFinal;
  }

  /**
   * Factory method para criar instância a partir de dados do banco
   * @param data - Dados do status vindos da tabela certificate_status
   * @returns Result com CertificateStatusValueObject ou erro
   */
  static create(data: CertificateStatusData): Result<CertificateStatusValueObject> {
    if (!data.id || !data.name) {
      return failure('Dados de status inválidos: id e name são obrigatórios');
    }

    return success(new CertificateStatusValueObject(data));
  }

  /**
   * Factory method para criar a partir de CertificateStatusInfo
   * @param info - Informações resumidas do status
   */
  static fromInfo(info: CertificateStatusInfo): Result<CertificateStatusValueObject> {
    return CertificateStatusValueObject.create({
      id: info.id,
      name: info.name,
      displayName: info.displayName,
      color: info.color,
      canEditCertificate: info.canEditCertificate,
      isFinal: info.isFinal,
    });
  }

  /**
   * Retorna o ID do status
   */
  getId(): string {
    return this.id;
  }

  /**
   * Retorna o nome interno do status (ex: 'pending', 'in_progress')
   */
  getName(): string {
    return this.name;
  }

  /**
   * Retorna o nome para exibição (ex: 'Pendente', 'Em Andamento')
   */
  getDisplayName(): string {
    return this.displayName;
  }

  /**
   * Retorna a cor do status em formato hexadecimal
   */
  getColor(): string {
    return this.color;
  }

  /**
   * Verifica se está pendente
   */
  isPending(): boolean {
    return this.name === 'pending';
  }

  /**
   * Verifica se está em andamento
   */
  isInProgress(): boolean {
    return this.name === 'in_progress';
  }

  /**
   * Verifica se está concluída
   */
  isCompleted(): boolean {
    return this.name === 'completed';
  }

  /**
   * Verifica se está cancelada
   */
  isCanceled(): boolean {
    return this.name === 'canceled';
  }

  /**
   * Verifica se é um status final (não permite mais alterações)
   */
  isFinal(): boolean {
    return this._isFinal;
  }

  /**
   * Verifica se a certidão pode ser editada neste status
   */
  canBeEdited(): boolean {
    return this._canEditCertificate;
  }

  /**
   * Compara com outro status
   */
  equals(other: CertificateStatusValueObject): boolean {
    return this.id === other.id;
  }

  /**
   * Retorna os dados do status como objeto plano
   */
  toDTO(): CertificateStatusInfo {
    return {
      id: this.id,
      name: this.name,
      displayName: this.displayName,
      color: this.color,
      canEditCertificate: this._canEditCertificate,
      isFinal: this._isFinal,
    };
  }
}
