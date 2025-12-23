import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Inject,
  HttpCode,
  ParseUUIDPipe,
  NotFoundException,
} from '@nestjs/common';
import type { LoggerContract } from '../../../../shared/1-domain/contracts/logger.contract';
import { LOGGER_CONTRACT } from '../../../../shared/1-domain/contracts/logger.contract';
import {
  LOGIN_USECASE,
  LOGOUT_USECASE,
  GET_CURRENT_USER_USECASE,
  GET_USER_PROFILE_USECASE,
} from '../../4-infrastructure/di/auth.tokens';
import type { LoginUseCase } from '../../2-application/use-cases/login.usecase';
import type { LogoutUseCase } from '../../2-application/use-cases/logout.usecase';
import type { GetCurrentUserUseCase } from '../../2-application/use-cases/get-current-user.usecase';
import type { GetUserProfileUseCase } from '../../2-application/use-cases/get-user-profile.usecase';
import { LoginApiDto } from '../api-dto/login.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { CurrentUser } from '../decorators/current-user.decorator';
import type { AuthenticatedUser } from '../types/express-request.types';
import { ResultToHttpHelper } from '../helpers/result-to-http.helper';
import { LoginRequestDto } from '../../2-application/dto/login-request.dto';
import { AuthError } from '../../1-domain/errors/auth-errors.enum';

/**
 * Controller de autenticação
 * Implementa endpoints de login, logout e obtenção de usuário atual
 */
@Controller('auth')
export class AuthController {
  constructor(
    @Inject(LOGIN_USECASE) private readonly loginUseCase: LoginUseCase,
    @Inject(LOGOUT_USECASE) private readonly logoutUseCase: LogoutUseCase,
    @Inject(GET_CURRENT_USER_USECASE)
    _getCurrentUserUseCase: GetCurrentUserUseCase,
    @Inject(GET_USER_PROFILE_USECASE)
    private readonly getUserProfileUseCase: GetUserProfileUseCase,
    @Inject(LOGGER_CONTRACT) private readonly logger: LoggerContract,
  ) {}

  /**
   * Endpoint de login
   * POST /auth/login (com prefixo global: /api/auth/login)
   * @param dto - Dados de login (email, password)
   * @returns AuthResponseDto com usuário e tokens
   */
  @Post('login')
  @HttpCode(200)
  async login(@Body() dto: LoginApiDto) {
    this.logger.debug('Requisição de login', { email: dto.email });

    const request = new LoginRequestDto(dto.email, dto.password);
    const result = await this.loginUseCase.execute(request);

    // Converte Result em resposta HTTP
    const authResponse = ResultToHttpHelper.handleAuth(result);

    // Retorna usuário e tokens do Supabase
    return authResponse;
  }

  /**
   * Endpoint de logout
   * POST /auth/logout (com prefixo global: /api/auth/logout)
   * Protegido por JwtAuthGuard
   * @param user - Usuário autenticado
   * @returns { message: 'Logout realizado com sucesso' }
   */
  @Post('logout')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  async logout(@CurrentUser() user: AuthenticatedUser) {
    this.logger.debug('Requisição de logout', { userId: user.userId });

    // Em JWT stateless, apenas registra auditoria
    const result = await this.logoutUseCase.execute('');

    ResultToHttpHelper.handleAuth(result);

    return {
      message: 'Logout realizado com sucesso',
    };
  }

  /**
   * Endpoint para obter dados do usuário autenticado
   * GET /auth/me (com prefixo global: /api/auth/me)
   * Protegido por JwtAuthGuard
   * @param user - Usuário autenticado
   * @returns Dados do usuário autenticado
   */
  @Get('me')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  async getCurrentUser(@CurrentUser() user: AuthenticatedUser) {
    this.logger.debug('Requisição de usuário atual', { userId: user.userId });

    // Aqui poderíamos chamar getCurrentUserUseCase para validação adicional
    // Por enquanto, retorna dados do request (já validados pelo guard)

    return {
      id: user.userId,
      email: user.email,
      role: user.role,
    };
  }

  /**
   * Endpoint de teste - apenas admin pode acessar
   * GET /auth/admin-test (com prefixo global: /api/auth/admin-test)
   * @param user - Usuário autenticado
   * @returns Mensagem de teste
   */
  @Get('admin-test')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async adminTest(@CurrentUser() user: AuthenticatedUser) {
    this.logger.info('Acesso admin test', { userId: user.userId });

    return {
      message: 'Você é um administrador!',
      userId: user.userId,
    };
  }

  /**
   * Endpoint para obter perfil de usuário pelo ID
   * GET /auth/users/:id (com prefixo global: /api/auth/users/:id)
   * Protegido por JwtAuthGuard
   * @param id - ID do usuário (UUID)
   * @returns Perfil básico do usuário
   */
  @Get('users/:id')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  async getUserProfile(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    this.logger.debug('Requisição de perfil por ID', {
      requesterId: user.userId,
      targetUserId: id,
    });

    const result = await this.getUserProfileUseCase.execute(id);

    if (
      !result.success &&
      (result.error === AuthError.USER_NOT_FOUND ||
        result.error === AuthError.PROFILE_NOT_FOUND)
    ) {
      throw new NotFoundException(result.error);
    }

    const profile = ResultToHttpHelper.handle(result);

    return {
      id: profile.id,
      fullName: profile.fullName,
      role: profile.role.getValue(),
    };
  }
}
