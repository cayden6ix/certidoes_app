/**
 * Utilitários para formatação de datas
 * Centraliza a configuração de locale e formatos de data
 */

/**
 * Locale padrão para formatação de datas
 */
const DEFAULT_LOCALE = 'pt-BR' as const;

/**
 * Opções de formatação para diferentes contextos
 */
const DATE_FORMAT_OPTIONS = {
  /** Formato curto: 01/01/2024 */
  short: {} as Intl.DateTimeFormatOptions,
  /** Formato médio: 01 jan. 2024 */
  medium: { day: '2-digit', month: 'short', year: 'numeric' } as Intl.DateTimeFormatOptions,
  /** Formato longo: 01 de janeiro de 2024 */
  long: { day: '2-digit', month: 'long', year: 'numeric' } as Intl.DateTimeFormatOptions,
} as const;

type DateFormatType = keyof typeof DATE_FORMAT_OPTIONS;

/**
 * Formata uma data para exibição no formato brasileiro
 * @param date - Data ou string de data a ser formatada
 * @param format - Tipo de formato desejado (short, medium, long)
 * @returns String formatada ou vazio se data inválida
 */
export function formatDate(
  date: Date | string | null | undefined,
  format: DateFormatType = 'short',
): string {
  if (!date) {
    return '';
  }

  const dateObj = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) {
    return '';
  }

  return dateObj.toLocaleDateString(DEFAULT_LOCALE, DATE_FORMAT_OPTIONS[format]);
}

/**
 * Formata uma data com hora para exibição
 * @param date - Data ou string de data a ser formatada
 * @returns String formatada com data e hora
 */
export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) {
    return '';
  }

  const dateObj = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) {
    return '';
  }

  return dateObj.toLocaleString(DEFAULT_LOCALE);
}
