/**
 * DTO para resposta de refresh token
 * Usado internamente na camada de aplicação
 */
export class RefreshTokenResponseDto {
  constructor(
    public readonly accessToken: string,
    public readonly refreshToken: string,
    public readonly expiresAt: number,
  ) {}
}
