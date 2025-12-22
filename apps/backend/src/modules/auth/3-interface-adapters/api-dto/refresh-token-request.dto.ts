import { IsNotEmpty, IsString } from 'class-validator';

/**
 * DTO para requisição de refresh token via API
 */
export class RefreshTokenApiRequestDto {
  @IsString({ message: 'Refresh token deve ser uma string' })
  @IsNotEmpty({ message: 'Refresh token é obrigatório' })
  refreshToken!: string;
}
