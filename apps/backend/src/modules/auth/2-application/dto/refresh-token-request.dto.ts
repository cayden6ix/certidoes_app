/**
 * DTO para requisição de refresh token
 * Usado internamente na camada de aplicação
 */
export class RefreshTokenRequestDto {
  constructor(public readonly refreshToken: string) {}
}
