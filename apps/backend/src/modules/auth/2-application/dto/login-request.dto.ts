/**
 * DTO de requisição para login
 * Representa os dados esperados na camada de aplicação
 */
export class LoginRequestDto {
  /**
   * Email do usuário
   */
  email: string;

  /**
   * Senha em texto plano
   */
  password: string;

  constructor(email: string, password: string) {
    this.email = email;
    this.password = password;
  }
}
