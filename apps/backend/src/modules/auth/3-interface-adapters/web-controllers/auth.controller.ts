import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { LoggerContract } from '../../../../shared/1-domain/contracts/logger.contract';
import {
  AuthenticateUserUseCase,
  LogoutUserUseCase,
  RefreshTokenUseCase,
} from '../../2-application';
import { AuthenticationRequestDto } from '../../2-application/dto/authentication-request.dto';
import { RefreshTokenRequestDto } from '../../2-application/dto/refresh-token-request.dto';
import { AUTH_TOKENS } from '../../4-infrastructure/di/auth.tokens';
import { LoginRequestDto } from '../api-dto/login-request.dto';
import { LoginResponseDto } from '../api-dto/login-response.dto';
import { RefreshTokenApiRequestDto } from '../api-dto/refresh-token-request.dto';
import { RefreshTokenApiResponseDto } from '../api-dto/refresh-token-response.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

/**
 * Controller de autenticação
 * Expõe endpoints REST para login, refresh e logout
 */
@Controller('auth')
export class AuthController {
  constructor(
    @Inject(AUTH_TOKENS.AUTHENTICATE_USER_USECASE)
    private readonly authenticateUserUseCase: AuthenticateUserUseCase,
    @Inject(AUTH_TOKENS.REFRESH_TOKEN_USECASE)
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
    @Inject(AUTH_TOKENS.LOGOUT_USER_USECASE)
    private readonly logoutUserUseCase: LogoutUserUseCase,
    @Inject(AUTH_TOKENS.LOGGER)
    private readonly logger: LoggerContract,
  ) {}

  /**
   * POST /auth/login
   * Autentica usuário com email e senha
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginRequestDto): Promise<LoginResponseDto> {
    this.logger.info('Requisição de login recebida', {
      context: 'AuthController',
      endpoint: 'POST /auth/login',
    });

    const appDto = new AuthenticationRequestDto(dto.email, dto.password);
    const result = await this.authenticateUserUseCase.execute(appDto);

    return {
      user: result.user,
      session: result.session,
    };
  }

  /**
   * POST /auth/refresh
   * Renova o access token usando refresh token
   */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Body() dto: RefreshTokenApiRequestDto,
  ): Promise<RefreshTokenApiResponseDto> {
    this.logger.info('Requisição de refresh token recebida', {
      context: 'AuthController',
      endpoint: 'POST /auth/refresh',
    });

    const appDto = new RefreshTokenRequestDto(dto.refreshToken);
    const result = await this.refreshTokenUseCase.execute(appDto);

    return {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      expiresAt: result.expiresAt,
    };
  }

  /**
   * POST /auth/logout
   * Realiza logout do usuário
   */
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Req() req: Request): Promise<void> {
    const user = (req as any).user;

    if (!user || !user.userId) {
      throw new UnauthorizedException('Usuário não autenticado');
    }

    this.logger.info('Requisição de logout recebida', {
      context: 'AuthController',
      endpoint: 'POST /auth/logout',
      userId: user.userId,
    });

    const token = req.headers.authorization?.replace('Bearer ', '') || '';
    await this.logoutUserUseCase.execute(token, user.userId);
  }
}
