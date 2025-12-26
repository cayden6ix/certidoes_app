import type { CertificateEntity } from '../entities/certificate.entity';
import type { StatusValidationRequirement } from '../contracts/certificate-status-validation.contract';

/**
 * Dados de validação fornecidos pelo usuário
 */
export interface UserValidationData {
  confirmed?: boolean;
  statement?: string;
}

/**
 * Resultado da validação de mudança de status
 */
export interface StatusValidationResult {
  isValid: boolean;
  errorCode?: 'CONFIRMATION_REQUIRED' | 'REQUIRED_FIELD_MISSING';
  missingField?: string;
}

/**
 * Texto padrão de confirmação quando não há texto configurado
 */
const DEFAULT_CONFIRMATION_STATEMENT =
  'Eu verifiquei e confirmei as mudanças que estou prestes a fazer';

/**
 * Serviço de domínio puro para validação de regras de mudança de status
 * Valida confirmações obrigatórias e campos requeridos antes de permitir mudança
 * Não possui dependências de infraestrutura (Clean Architecture)
 */
export class CertificateStatusValidationService {
  /**
   * Valida se a mudança de status pode ser realizada
   * Verifica confirmação do usuário e campos obrigatórios
   * @param validationRules - Regras de validação configuradas para o status
   * @param userValidation - Dados de validação fornecidos pelo usuário
   * @param certificate - Certidão atual
   * @param updateData - Dados de atualização
   * @returns Resultado da validação
   */
  validateStatusChange(
    validationRules: StatusValidationRequirement[],
    userValidation: UserValidationData | undefined,
    certificate: CertificateEntity,
    updateData: Record<string, unknown>,
  ): StatusValidationResult {
    // Sem regras, permite a mudança
    if (validationRules.length === 0) {
      return { isValid: true };
    }

    // Valida confirmação obrigatória
    const confirmationResult = this.validateConfirmation(validationRules, userValidation);
    if (!confirmationResult.isValid) {
      return confirmationResult;
    }

    // Valida campos obrigatórios
    const fieldsResult = this.validateRequiredFields(validationRules, certificate, updateData);
    if (!fieldsResult.isValid) {
      return fieldsResult;
    }

    return { isValid: true };
  }

  /**
   * Extrai o texto de confirmação requerido das regras
   * @param validationRules - Regras de validação configuradas
   * @returns Texto de confirmação ou texto padrão
   */
  getRequiredConfirmationStatement(validationRules: StatusValidationRequirement[]): string {
    const configuredStatements = validationRules
      .map((rule) => rule.confirmationText)
      .filter((value): value is string => Boolean(value?.trim()))
      .map((value) => value.trim());

    const uniqueStatements = [...new Set(configuredStatements)];

    return uniqueStatements.length > 0 ? uniqueStatements[0] : DEFAULT_CONFIRMATION_STATEMENT;
  }

  /**
   * Verifica se há múltiplos textos de confirmação (situação inválida)
   * @param validationRules - Regras de validação configuradas
   */
  hasMultipleConfirmationStatements(validationRules: StatusValidationRequirement[]): boolean {
    const configuredStatements = validationRules
      .map((rule) => rule.confirmationText)
      .filter((value): value is string => Boolean(value?.trim()))
      .map((value) => value.trim());

    const uniqueStatements = [...new Set(configuredStatements)];

    return uniqueStatements.length > 1;
  }

  /**
   * Valida se o usuário confirmou a mudança corretamente
   * @param validationRules - Regras de validação
   * @param userValidation - Dados fornecidos pelo usuário
   */
  private validateConfirmation(
    validationRules: StatusValidationRequirement[],
    userValidation: UserValidationData | undefined,
  ): StatusValidationResult {
    // Múltiplos textos de confirmação é situação inválida
    if (this.hasMultipleConfirmationStatements(validationRules)) {
      return { isValid: false, errorCode: 'CONFIRMATION_REQUIRED' };
    }

    const confirmed = userValidation?.confirmed === true;
    const requiredStatement = this.getRequiredConfirmationStatement(validationRules);
    const statementMatches = (userValidation?.statement ?? '').trim() === requiredStatement;

    if (!confirmed || !statementMatches) {
      return { isValid: false, errorCode: 'CONFIRMATION_REQUIRED' };
    }

    return { isValid: true };
  }

  /**
   * Valida se os campos obrigatórios estão preenchidos
   * @param validationRules - Regras de validação
   * @param certificate - Certidão atual
   * @param updateData - Dados de atualização
   */
  private validateRequiredFields(
    validationRules: StatusValidationRequirement[],
    certificate: CertificateEntity,
    updateData: Record<string, unknown>,
  ): StatusValidationResult {
    const certificateRecord = certificate as unknown as Record<string, unknown>;

    for (const rule of validationRules) {
      if (!rule.requiredField) {
        continue;
      }

      const fieldKey = rule.requiredField;
      const candidateValue =
        fieldKey in updateData ? updateData[fieldKey] : certificateRecord[fieldKey];

      if (!this.isValueFilled(candidateValue)) {
        return {
          isValid: false,
          errorCode: 'REQUIRED_FIELD_MISSING',
          missingField: fieldKey,
        };
      }
    }

    return { isValid: true };
  }

  /**
   * Verifica se um valor está preenchido (não nulo, não undefined, não string vazia)
   * @param value - Valor a verificar
   */
  private isValueFilled(value: unknown): boolean {
    if (value === null || value === undefined) {
      return false;
    }
    if (typeof value === 'string') {
      return value.trim() !== '';
    }
    return true;
  }
}
