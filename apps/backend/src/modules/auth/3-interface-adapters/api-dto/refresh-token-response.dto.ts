/**
 * DTO para resposta de refresh token via API
 */
export class RefreshTokenApiResponseDto {
  accessToken!: string;
  refreshToken!: string;
  expiresAt!: number;
}
