/**
 * Utilitários para manipulação de valores monetários em centavos
 *
 * IMPORTANTE: Todos os valores monetários são armazenados em CENTAVOS (bigint no banco)
 * Exemplo: R$ 10,50 = 1050 centavos
 */

/**
 * Formatador de moeda BRL
 */
const brlFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

/**
 * Converte centavos para reais
 * @param cents - Valor em centavos
 * @returns Valor em reais
 * @example centsToReais(1050) // 10.50
 */
export function centsToReais(cents: number | null | undefined): number {
  if (cents === null || cents === undefined) {
    return 0;
  }
  return cents / 100;
}

/**
 * Converte reais para centavos
 * @param reais - Valor em reais
 * @returns Valor em centavos (arredondado)
 * @example reaisToCents(10.50) // 1050
 */
export function reaisToCents(reais: number | null | undefined): number {
  if (reais === null || reais === undefined) {
    return 0;
  }
  return Math.round(reais * 100);
}

/**
 * Formata centavos como string BRL
 * @param cents - Valor em centavos
 * @returns String formatada (ex: "R$ 10,50")
 * @example formatCentsToBRL(1050) // "R$ 10,50"
 */
export function formatCentsToBRL(cents: number | null | undefined): string {
  if (cents === null || cents === undefined) {
    return '-';
  }
  return brlFormatter.format(centsToReais(cents));
}

/**
 * Formata centavos como valor decimal para input
 * @param cents - Valor em centavos
 * @returns String com valor decimal (ex: "10.50" ou "")
 * @example formatCentsForInput(1050) // "10.50"
 */
export function formatCentsForInput(cents: number | null | undefined): string {
  if (cents === null || cents === undefined) {
    return '';
  }
  return centsToReais(cents).toFixed(2);
}

/**
 * Parseia string de input para centavos
 * @param value - String do input (ex: "10.50" ou "10,50")
 * @returns Valor em centavos ou null se inválido
 * @example parseInputToCents("10.50") // 1050
 * @example parseInputToCents("10,50") // 1050
 * @example parseInputToCents("") // null
 */
export function parseInputToCents(value: string | null | undefined): number | null {
  if (!value || value.trim() === '') {
    return null;
  }

  // Suporta tanto ponto quanto vírgula como separador decimal
  const normalizedValue = value.replace(',', '.');
  const parsed = parseFloat(normalizedValue);

  if (isNaN(parsed)) {
    return null;
  }

  return reaisToCents(parsed);
}

/**
 * Valida se um valor em centavos é válido (não negativo)
 * @param cents - Valor em centavos
 * @returns true se válido
 */
export function isValidCents(cents: number | null | undefined): boolean {
  if (cents === null || cents === undefined) {
    return true; // null é válido (opcional)
  }
  return Number.isInteger(cents) && cents >= 0;
}
