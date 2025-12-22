/**
 * Enumeração de erros de autenticação
 * Evita strings mágicas no código e facilita internacionalização futura
 * Mensagens em português conforme padrão CodeForm
 */
export enum AuthError {
  // Erros de credenciais
  INVALID_CREDENTIALS = 'Credenciais inválidas',
  USER_NOT_FOUND = 'Usuário não encontrado',

  // Erros de token
  TOKEN_EXPIRED = 'Token expirado',
  TOKEN_INVALID = 'Token inválido',
  TOKEN_MISSING = 'Token não fornecido',

  // Erros de autorização
  UNAUTHORIZED = 'Não autorizado',
  INSUFFICIENT_PERMISSIONS = 'Permissões insuficientes',

  // Erros de dados
  PROFILE_NOT_FOUND = 'Perfil não encontrado',
  INVALID_EMAIL = 'Email inválido',
  WEAK_PASSWORD = 'Senha fraca demais',

  // Erros de servidor
  AUTHENTICATION_SERVICE_ERROR = 'Erro no serviço de autenticação',
}
