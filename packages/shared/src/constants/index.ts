/**
 * Constantes centralizadas do sistema
 * Compartilhadas entre frontend e backend
 */

import { CERTIFICATE_STATUS_COLORS } from '../types/certificate-status.types.js';

// === PAGINAÇÃO ===

/**
 * Configurações padrão de paginação
 */
export const PAGINATION = {
  /** Tamanho padrão de página */
  DEFAULT_PAGE_SIZE: 50,
  /** Tamanho máximo permitido por página */
  MAX_PAGE_SIZE: 100,
} as const;

// === VALORES PADRÃO ===

/**
 * Valores padrão para campos opcionais
 */
export const DEFAULTS = {
  /** Texto padrão para valores desconhecidos ou ausentes */
  UNKNOWN_VALUE: 'Desconhecido',
  /** Cor padrão quando não especificada (gray-500) */
  DEFAULT_COLOR: CERTIFICATE_STATUS_COLORS.DEFAULT,
  /** Prioridade padrão para novas certidões */
  DEFAULT_PRIORITY: 'normal' as const,
  /** Role padrão para novos usuários */
  DEFAULT_ROLE: 'client' as const,
  /** Nome padrão para operações de sistema */
  SYSTEM_USER_NAME: 'Sistema',
} as const;

// === LIMITES DE OPERAÇÕES ===

/**
 * Limites para operações em massa e campos
 */
export const LIMITS = {
  /** Máximo de certidões por operação em massa */
  BULK_UPDATE_MAX: 50,
  /** Tamanho máximo do campo de notas */
  MAX_NOTES_LENGTH: 2000,
  /** Tamanho máximo do campo de comentário */
  MAX_COMMENT_LENGTH: 1000,
  /** Tamanho máximo do campo de nome */
  MAX_NAME_LENGTH: 255,
} as const;

// === MAPEAMENTO DE PRIORIDADES ===

/**
 * Converte valor numérico do banco para string de prioridade
 */
export const PRIORITY_FROM_DB: Record<number, 'normal' | 'urgent'> = {
  1: 'normal',
  2: 'urgent',
};

/**
 * Converte string de prioridade para valor numérico do banco
 */
export const PRIORITY_TO_DB: Record<'normal' | 'urgent', number> = {
  normal: 1,
  urgent: 2,
};

// === VALIDAÇÃO ===

/**
 * Constantes de validação para DTOs
 */
export const VALIDATION = {
  /** Tamanho máximo do campo de notas */
  MAX_NOTES_LENGTH: LIMITS.MAX_NOTES_LENGTH,
  /** Tamanho máximo do campo de comentário */
  MAX_COMMENT_LENGTH: LIMITS.MAX_COMMENT_LENGTH,
  /** Tamanho máximo do campo de nome */
  MAX_NAME_LENGTH: LIMITS.MAX_NAME_LENGTH,
} as const;
