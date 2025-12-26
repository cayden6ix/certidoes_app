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

import type { ListStatusValidationsUseCase } from '../../2-application/use-cases/certificate-status-validations/list-status-validations.usecase';
import type { CreateStatusValidationUseCase } from '../../2-application/use-cases/certificate-status-validations/create-status-validation.usecase';
import type { UpdateStatusValidationUseCase } from '../../2-application/use-cases/certificate-status-validations/update-status-validation.usecase';
import type { RemoveStatusValidationUseCase } from '../../2-application/use-cases/certificate-status-validations/remove-status-validation.usecase';

import {
  LIST_STATUS_VALIDATIONS_USECASE,
  CREATE_STATUS_VALIDATION_USECASE,
  UPDATE_STATUS_VALIDATION_USECASE,
  REMOVE_STATUS_VALIDATION_USECASE,
} from '../../4-infrastructure/di/admin.tokens';

import {
  CreateCertificateStatusValidationDto,
  ListCertificateStatusValidationQueryDto,
  UpdateCertificateStatusValidationDto,
} from '../api-dto/certificate-status-validation.dto';

/**
 * Controller para gerenciamento de validações por status de certidão
 * Segue o padrão de Interface Adapters da Clean Architecture
 */
@Controller('admin/certificate-status-validations')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class CertificateStatusValidationsController {
  constructor(
    @Inject(LIST_STATUS_VALIDATIONS_USECASE)
    private readonly listStatusValidationsUseCase: ListStatusValidationsUseCase,
    @Inject(CREATE_STATUS_VALIDATION_USECASE)
    private readonly createStatusValidationUseCase: CreateStatusValidationUseCase,
    @Inject(UPDATE_STATUS_VALIDATION_USECASE)
    private readonly updateStatusValidationUseCase: UpdateStatusValidationUseCase,
    @Inject(REMOVE_STATUS_VALIDATION_USECASE)
    private readonly removeStatusValidationUseCase: RemoveStatusValidationUseCase,
    @Inject(LOGGER_CONTRACT)
    private readonly logger: LoggerContract,
  ) {}

  @Get()
  @HttpCode(200)
  async list(@Query() query: ListCertificateStatusValidationQueryDto) {
    const pagination = PaginationService.normalize({
      page: query.page,
      pageSize: query.pageSize,
      limit: query.limit,
      offset: query.offset,
    });

    const result = await this.listStatusValidationsUseCase.execute({
      statusId: query.statusId,
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
  async create(@Body() dto: CreateCertificateStatusValidationDto) {
    this.logger.debug('Criando validação por status', {
      statusId: dto.statusId,
      validationId: dto.validationId,
    });

    const result = await this.createStatusValidationUseCase.execute({
      statusId: dto.statusId,
      validationId: dto.validationId,
      requiredField: dto.requiredField ?? null,
      confirmationText: dto.confirmationText ?? null,
    });

    if (!result.success) {
      throw new BadRequestException(result.error);
    }

    return result.data;
  }

  @Patch(':id')
  @HttpCode(200)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCertificateStatusValidationDto,
  ) {
    this.logger.debug('Atualizando validação por status', { id, fields: Object.keys(dto) });

    const result = await this.updateStatusValidationUseCase.execute(id, {
      statusId: dto.statusId,
      validationId: dto.validationId,
      requiredField: dto.requiredField ?? null,
      confirmationText: dto.confirmationText ?? null,
    });

    if (!result.success) {
      throw new BadRequestException(result.error);
    }

    return result.data;
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    this.logger.debug('Removendo validação por status', { id });

    const result = await this.removeStatusValidationUseCase.execute(id);

    if (!result.success) {
      throw new BadRequestException(result.error);
    }
  }
}
