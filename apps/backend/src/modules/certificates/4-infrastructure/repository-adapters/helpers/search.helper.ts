/**
 * Helper para operações de busca em certidões
 * Encapsula lógica de normalização e formatação de valores
 */
export class CertificateSearchHelper {
  /**
   * Normaliza valor de busca removendo caracteres especiais
   */
  static normalizeSearchValue(value: string): string {
    return value.replace(/[{},()]/g, ' ').replace(/,/g, ' ').replace(/\s+/g, ' ').trim();
  }

  /**
   * Formata valor para busca em array PostgreSQL
   */
  static formatArraySearchValue(value: string): string {
    const escaped = value.replace(/"/g, '\\"');
    return `"${escaped}"`;
  }

  /**
   * Verifica se erro é relacionado a formato de array literal
   */
  static isArrayLiteralError(message?: string): boolean {
    if (!message) {
      return false;
    }

    const normalized = message.toLowerCase();
    return normalized.includes('array literal') || normalized.includes('array');
  }
}
