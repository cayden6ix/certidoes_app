/**
 * Tipos relacionados a usuários
 * Compartilhados entre frontend e backend
 */

/**
 * Papel do usuário no sistema
 */
export type UserRole = 'client' | 'admin';

/**
 * Perfil do usuário
 */
export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}
