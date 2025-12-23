import type { AuthUserEntity } from '../../1-domain/entities/auth-user.entity';

/**
 * DTO de resposta de autenticação
 * Contém os dados retornados após login bem-sucedido
 */
export class AuthResponseDto {
  /**
   * Dados do usuário autenticado
   */
  user: {
    id: string;
    email: string;
    fullName: string;
    role: 'client' | 'admin';
    createdAt: Date;
  };

  /**
   * Token JWT para acesso à API
   */
  accessToken: string;

  /**
   * Token para renovar a sessão (opcional)
   * Implementação de refresh token está fora do escopo da Sprint 2
   */
  refreshToken?: string;

  constructor(
    user: AuthUserEntity,
    accessToken: string,
    refreshToken?: string,
  ) {
    this.user = user.toDTO();
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
  }
}
