/**
 * Tokens de injeção de dependência para o módulo de certidões
 * Usados para injetar dependências sem acoplamento direto
 */

// Repositórios
export const CERTIFICATE_REPOSITORY_CONTRACT = Symbol('CERTIFICATE_REPOSITORY_CONTRACT');
export const CERTIFICATE_EVENT_REPOSITORY_CONTRACT = Symbol(
  'CERTIFICATE_EVENT_REPOSITORY_CONTRACT',
);

// Use Cases
export const CREATE_CERTIFICATE_USECASE = Symbol('CREATE_CERTIFICATE_USECASE');
export const LIST_CERTIFICATES_USECASE = Symbol('LIST_CERTIFICATES_USECASE');
export const GET_CERTIFICATE_USECASE = Symbol('GET_CERTIFICATE_USECASE');
export const UPDATE_CERTIFICATE_USECASE = Symbol('UPDATE_CERTIFICATE_USECASE');
export const LIST_CERTIFICATE_EVENTS_USECASE = Symbol('LIST_CERTIFICATE_EVENTS_USECASE');
