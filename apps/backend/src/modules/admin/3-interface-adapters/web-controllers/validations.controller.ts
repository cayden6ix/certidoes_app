import {
  BadRequestException,
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

import type { ListValidationsUseCase } from '../../2-application/use-cases/validations/list-validations.usecase';
import type { CreateValidationUseCase } from '../../2-application/use-cases/validations/create-validation.usecase';
import type { UpdateValidationUseCase } from '../../2-application/use-cases/validations/update-validation.usecase';
import type { RemoveValidationUseCase } from '../../2-application/use-cases/validations/remove-validation.usecase';

import {
  LIST_VALIDATIONS_USECASE,
  CREATE_VALIDATION_USECASE,
  UPDATE_VALIDATION_USECASE,
  REMOVE_VALIDATION_USECASE,
} from '../../4-infrastructure/di/admin.tokens';

import {
  CreateValidationDto,
  ListValidationQueryDto,
  UpdateValidationDto,
} from '../api-dto/validation.dto';

/**
 * Controller para gerenciamento de validações
 * Segue o padrão de Interface Adapters da Clean Architecture
 */
@Controller('admin/validations')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class ValidationsController {
  constructor(
    @Inject(LIST_VALIDATIONS_USECASE)
    private readonly listValidationsUseCase: ListValidationsUseCase,
    @Inject(CREATE_VALIDATION_USECASE)
    private readonly createValidationUseCase: CreateValidationUseCase,
    @Inject(UPDATE_VALIDATION_USECASE)
    private readonly updateValidationUseCase: UpdateValidationUseCase,
    @Inject(REMOVE_VALIDATION_USECASE)
    private readonly removeValidationUseCase: RemoveValidationUseCase,
    @Inject(LOGGER_CONTRACT)
    private readonly logger: LoggerContract,
  ) {}

  @Get()
  @HttpCode(200)
  async list(@Query() query: ListValidationQueryDto) {
    const pagination = PaginationService.normalize({
      page: query.page,
      pageSize: query.pageSize,
      limit: query.limit,
      offset: query.offset,
    });

    const result = await this.listValidationsUseCase.execute({
      search: query.search,
      includeInactive: query.includeInactive,
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
  async create(@Body() dto: CreateValidationDto) {
    this.logger.debug('Criando validação', { name: dto.name });

    const result = await this.createValidationUseCase.execute({
      name: dto.name,
      description: dto.description,
      isActive: dto.isActive,
    });

    if (!result.success) {
      throw new BadRequestException(result.error);
    }

    return result.data;
  }

  @Patch(':id')
  @HttpCode(200)
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateValidationDto) {
    this.logger.debug('Atualizando validação', { id, fields: Object.keys(dto) });

    const result = await this.updateValidationUseCase.execute(id, {
      name: dto.name,
      description: dto.description,
      isActive: dto.isActive,
    });

    if (!result.success) {
      throw new BadRequestException(result.error);
    }

    return result.data;
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    this.logger.debug('Removendo validação', { id });

    const result = await this.removeValidationUseCase.execute(id);

    if (!result.success) {
      throw new BadRequestException(result.error);
    }
  }
}
