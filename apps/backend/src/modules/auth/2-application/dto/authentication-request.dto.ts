/**
 * DTO para requisição de autenticação
 * Usado internamente na camada de aplicação
 */
export class AuthenticationRequestDto {
  constructor(
    public readonly email: string,
    public readonly password: string,
  ) {}
}
