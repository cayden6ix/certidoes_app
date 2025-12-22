import { IsEmail, IsString, MinLength } from 'class-validator';

/**
 * DTO de login para API
 * Valida dados de entrada com class-validator
 */
export class LoginApiDto {
  /**
   * Email do usuário
   */
  @IsEmail({}, { message: 'Email deve ser válido' })
  email!: string;

  /**
   * Senha do usuário
   * Mínimo de 6 caracteres
   */
  @IsString({ message: 'Senha deve ser uma string' })
  @MinLength(6, { message: 'Senha deve ter no mínimo 6 caracteres' })
  password!: string;
}
