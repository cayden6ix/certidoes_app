import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Inject,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import type { LoggerContract } from '../../../../shared/1-domain/contracts/logger.contract';
import { LOGGER_CONTRACT } from '../../../../shared/1-domain/contracts/logger.contract';
import { PaginationService } from '../../../../shared/2-application/services/pagination.service';
import { JwtAuthGuard } from '../../../auth/3-interface-adapters/guards/jwt-auth.guard';
import { RolesGuard } from '../../../auth/3-interface-adapters/guards/roles.guard';
import { Roles } from '../../../auth/3-interface-adapters/decorators/roles.decorator';
import { AdminUsersService } from '../../2-application/services/admin-users.service';
import {
  CreateAdminUserDto,
  ListUsersQueryDto,
  UpdateAdminUserDto,
} from '../api-dto/users.dto';

@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminUsersController {
  constructor(
    private readonly adminUsersService: AdminUsersService,
    @Inject(LOGGER_CONTRACT) private readonly logger: LoggerContract,
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

    const result = await this.adminUsersService.list({
      search: query.search,
      limit: pagination.limit,
      offset: pagination.offset,
    });

    return {
      data: result.data,
      total: result.total,
      limit: pagination.limit,
      offset: pagination.offset,
    };
  }

  @Post()
  @HttpCode(201)
  async create(@Body() dto: CreateAdminUserDto) {
    this.logger.debug('Criando novo usuário', { email: dto.email, role: dto.role });
    return this.adminUsersService.create({
      fullName: dto.fullName,
      email: dto.email,
      password: dto.password,
      role: dto.role ?? 'client',
    });
  }

  @Patch(':id')
  @HttpCode(200)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAdminUserDto,
  ) {
    this.logger.debug('Atualizando usuário', { id, fields: Object.keys(dto) });
    return this.adminUsersService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    this.logger.debug('Removendo usuário', { id });
    await this.adminUsersService.remove(id);
  }
}
