/**
 * Enum com mensagens de erro do módulo de certidões
 * Todas as mensagens em português conforme padrão do projeto
 */
export enum CertificateError {
  // Erros de validação
  INVALID_CERTIFICATE_TYPE = 'Tipo de certidão inválido',
  INVALID_RECORD_NUMBER = 'Número da ficha inválido',
  INVALID_PARTIES_NAME = 'Nome das partes é obrigatório',
  INVALID_PRIORITY = 'Prioridade inválida',
  INVALID_STATUS = 'Status inválido',
  STATUS_VALIDATION_CONFIRMATION_REQUIRED = 'Confirmação de validação obrigatória',
  STATUS_VALIDATION_REQUIRED_FIELD = 'Campo obrigatório para mudança de status não preenchido',

  // Erros de negócio
  CERTIFICATE_NOT_FOUND = 'Certidão não encontrada',
  CERTIFICATE_ACCESS_DENIED = 'Acesso negado a esta certidão',
  CERTIFICATE_CANNOT_BE_EDITED = 'Esta certidão não pode ser editada',
  CERTIFICATE_ALREADY_COMPLETED = 'Esta certidão já foi concluída',
  CERTIFICATE_ALREADY_CANCELED = 'Esta certidão já foi cancelada',

  // Erros de sistema
  DATABASE_ERROR = 'Erro ao acessar o banco de dados',
  UNEXPECTED_ERROR = 'Erro inesperado ao processar certidão',
}
