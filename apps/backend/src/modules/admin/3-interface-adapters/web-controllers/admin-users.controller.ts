import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Inject,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';

import type { LoggerContract } from '../../../../shared/1-domain/contracts/logger.contract';
import { LOGGER_CONTRACT } from '../../../../shared/1-domain/contracts/logger.contract';
import { PaginationService } from '../../../../shared/2-application/services/pagination.service';
import { JwtAuthGuard } from '../../../auth/3-interface-adapters/guards/jwt-auth.guard';
import { RolesGuard } from '../../../auth/3-interface-adapters/guards/roles.guard';
import { Roles } from '../../../auth/3-interface-adapters/decorators/roles.decorator';

import type { ListAdminUsersUseCase } from '../../2-application/use-cases/list-admin-users.usecase';
import type { CreateAdminUserUseCase } from '../../2-application/use-cases/create-admin-user.usecase';
import type { UpdateAdminUserUseCase } from '../../2-application/use-cases/update-admin-user.usecase';
import type { RemoveAdminUserUseCase } from '../../2-application/use-cases/remove-admin-user.usecase';

import {
  LIST_ADMIN_USERS_USECASE,
  CREATE_ADMIN_USER_USECASE,
  UPDATE_ADMIN_USER_USECASE,
  REMOVE_ADMIN_USER_USECASE,
} from '../../4-infrastructure/di/admin.tokens';

import { AdminUserRepositoryError } from '../../4-infrastructure/repository-adapters/supabase-admin-user.repository';

import { CreateAdminUserDto, ListUsersQueryDto, UpdateAdminUserDto } from '../api-dto/users.dto';

/**
 * Controller para gerenciamento de usuários administrativos
 * Segue o padrão de Interface Adapters da Clean Architecture
 */
@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminUsersController {
  constructor(
    @Inject(LIST_ADMIN_USERS_USECASE)
    private readonly listUsersUseCase: ListAdminUsersUseCase,
    @Inject(CREATE_ADMIN_USER_USECASE)
    private readonly createUserUseCase: CreateAdminUserUseCase,
    @Inject(UPDATE_ADMIN_USER_USECASE)
    private readonly updateUserUseCase: UpdateAdminUserUseCase,
    @Inject(REMOVE_ADMIN_USER_USECASE)
    private readonly removeUserUseCase: RemoveAdminUserUseCase,
    @Inject(LOGGER_CONTRACT)
    private readonly logger: LoggerContract,
  ) {}

  @Get()
  @HttpCode(200)
  async list(@Query() query: ListUsersQueryDto) {
    const pagination = PaginationService.normalize({
      page: query.page,
      pageSize: query.pageSize,
      limit: query.limit,
      offset: query.offset,
    });

    const result = await this.listUsersUseCase.execute({
      search: query.search,
      limit: pagination.limit,
      offset: pagination.offset,
    });

    if (!result.success) {
      throw new BadRequestException(result.error);
    }

    return {
      data: result.data.data,
      total: result.data.total,
      limit: pagination.limit,
      offset: pagination.offset,
    };
  }

  @Post()
  @HttpCode(201)
  async create(@Body() dto: CreateAdminUserDto) {
    this.logger.debug('Criando novo usuário', { email: dto.email, role: dto.role });

    const result = await this.createUserUseCase.execute({
      fullName: dto.fullName,
      email: dto.email,
      password: dto.password,
      role: dto.role ?? 'client',
    });

    if (!result.success) {
      throw new BadRequestException(result.error);
    }

    return result.data;
  }

  @Patch(':id')
  @HttpCode(200)
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateAdminUserDto) {
    this.logger.debug('Atualizando usuário', { id, fields: Object.keys(dto) });

    const result = await this.updateUserUseCase.execute(id, dto);

    if (!result.success) {
      if (result.error === AdminUserRepositoryError.USER_NOT_FOUND) {
        throw new NotFoundException(result.error);
      }
      throw new BadRequestException(result.error);
    }

    return result.data;
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    this.logger.debug('Removendo usuário', { id });

    const result = await this.removeUserUseCase.execute(id);

    if (!result.success) {
      if (result.error === AdminUserRepositoryError.REMOVE_UNAUTHORIZED) {
        throw new UnauthorizedException(result.error);
      }
      throw new BadRequestException(result.error);
    }
  }
}
