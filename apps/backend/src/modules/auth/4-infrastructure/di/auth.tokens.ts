/**
 * Tokens de injeção de dependência para o módulo de autenticação
 * Usados para registrar providers e injetar em classes
 */

// Contratos (interfaces)
export const AUTH_REPOSITORY_CONTRACT = Symbol('AuthRepositoryContract');
export const TOKEN_SERVICE_CONTRACT = Symbol('TokenServiceContract');

// Use Cases
export const LOGIN_USECASE = Symbol('LoginUseCase');
export const LOGOUT_USECASE = Symbol('LogoutUseCase');
export const GET_CURRENT_USER_USECASE = Symbol('GetCurrentUserUseCase');
export const GET_USER_PROFILE_USECASE = Symbol('GetUserProfileUseCase');
