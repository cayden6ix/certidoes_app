import { LoggerContract } from '../../../../shared/1-domain/contracts/logger.contract';
import { AuthServiceContract } from '../../1-domain/contracts/auth.service.contract';
import { RefreshTokenRequestDto } from '../dto/refresh-token-request.dto';
import { RefreshTokenResponseDto } from '../dto/refresh-token-response.dto';

/**
 * Caso de uso: Renovar token de acesso
 * Orquestra o processo de renovação de token
 */
export class RefreshTokenUseCase {
  constructor(
    private readonly authService: AuthServiceContract,
    private readonly logger: LoggerContract,
  ) {}

  async execute(dto: RefreshTokenRequestDto): Promise<RefreshTokenResponseDto> {
    const startTime = Date.now();

    try {
      // Mascarar refresh token para log (primeiros e últimos 8 caracteres)
      const maskedToken =
        dto.refreshToken.length > 16
          ? `${dto.refreshToken.substring(0, 8)}...${dto.refreshToken.substring(dto.refreshToken.length - 8)}`
          : '***';

      this.logger.info('Iniciando renovação de token', {
        context: 'RefreshTokenUseCase',
        refreshToken: maskedToken,
      });

      // Renovar token com Supabase
      const result = await this.authService.refreshAccessToken(dto.refreshToken);

      const duration = Date.now() - startTime;

      this.logger.info('Token renovado com sucesso', {
        context: 'RefreshTokenUseCase',
        expiresAt: new Date(result.expiresAt * 1000).toISOString(),
        duration,
      });

      return new RefreshTokenResponseDto(
        result.accessToken,
        result.refreshToken,
        result.expiresAt,
      );
    } catch (error) {
      const duration = Date.now() - startTime;

      this.logger.error('Erro ao renovar token', {
        context: 'RefreshTokenUseCase',
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        duration,
      });

      throw error;
    }
  }
}
