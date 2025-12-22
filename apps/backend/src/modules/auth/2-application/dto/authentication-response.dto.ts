/**
 * DTO para resposta de autenticação
 * Usado internamente na camada de aplicação
 */
export class AuthenticationResponseDto {
  constructor(
    public readonly user: {
      id: string;
      email: string;
      fullName: string;
      role: 'client' | 'admin';
    },
    public readonly session: {
      accessToken: string;
      refreshToken: string;
      expiresAt: number;
    },
  ) {}
}
