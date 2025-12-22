/**
 * Tokens de injeção de dependência para o módulo Auth
 */
export const AUTH_TOKENS = {
  // Domain
  AUTH_USER_REPOSITORY: Symbol('AUTH_USER_REPOSITORY'),
  AUTH_SERVICE: Symbol('AUTH_SERVICE'),

  // Application
  AUTHENTICATE_USER_USECASE: Symbol('AUTHENTICATE_USER_USECASE'),
  REFRESH_TOKEN_USECASE: Symbol('REFRESH_TOKEN_USECASE'),
  LOGOUT_USER_USECASE: Symbol('LOGOUT_USER_USECASE'),

  // Infrastructure
  SUPABASE_CLIENT: Symbol('SUPABASE_CLIENT'),
  LOGGER: Symbol('LOGGER'),
} as const;
