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

import type { ListCertificateTypesUseCase } from '../../2-application/use-cases/certificate-types/list-certificate-types.usecase';
import type { CreateCertificateTypeUseCase } from '../../2-application/use-cases/certificate-types/create-certificate-type.usecase';
import type { UpdateCertificateTypeUseCase } from '../../2-application/use-cases/certificate-types/update-certificate-type.usecase';
import type { RemoveCertificateTypeUseCase } from '../../2-application/use-cases/certificate-types/remove-certificate-type.usecase';

import {
  LIST_CERTIFICATE_TYPES_USECASE,
  CREATE_CERTIFICATE_TYPE_USECASE,
  UPDATE_CERTIFICATE_TYPE_USECASE,
  REMOVE_CERTIFICATE_TYPE_USECASE,
} from '../../4-infrastructure/di/admin.tokens';

import {
  CreateCertificateTypeDto,
  ListCertificateTypesQueryDto,
  UpdateCertificateTypeDto,
} from '../api-dto/certificate-types.dto';

/**
 * Controller para gerenciamento de tipos de certidão
 * Segue o padrão de Interface Adapters da Clean Architecture
 */
@Controller('admin/certificate-types')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class CertificateTypesController {
  constructor(
    @Inject(LIST_CERTIFICATE_TYPES_USECASE)
    private readonly listCertificateTypesUseCase: ListCertificateTypesUseCase,
    @Inject(CREATE_CERTIFICATE_TYPE_USECASE)
    private readonly createCertificateTypeUseCase: CreateCertificateTypeUseCase,
    @Inject(UPDATE_CERTIFICATE_TYPE_USECASE)
    private readonly updateCertificateTypeUseCase: UpdateCertificateTypeUseCase,
    @Inject(REMOVE_CERTIFICATE_TYPE_USECASE)
    private readonly removeCertificateTypeUseCase: RemoveCertificateTypeUseCase,
    @Inject(LOGGER_CONTRACT)
    private readonly logger: LoggerContract,
  ) {}

  @Get()
  @HttpCode(200)
  async list(@Query() query: ListCertificateTypesQueryDto) {
    const pagination = PaginationService.normalize({
      page: query.page,
      pageSize: query.pageSize,
      limit: query.limit,
      offset: query.offset,
    });

    const result = await this.listCertificateTypesUseCase.execute({
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
  async create(@Body() dto: CreateCertificateTypeDto) {
    this.logger.debug('Criando tipo de certidão', { name: dto.name });

    const result = await this.createCertificateTypeUseCase.execute({
      name: dto.name,
    });

    if (!result.success) {
      throw new BadRequestException(result.error);
    }

    return result.data;
  }

  @Patch(':id')
  @HttpCode(200)
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateCertificateTypeDto) {
    this.logger.debug('Atualizando tipo de certidão', { id, fields: Object.keys(dto) });

    const result = await this.updateCertificateTypeUseCase.execute(id, {
      name: dto.name,
    });

    if (!result.success) {
      throw new BadRequestException(result.error);
    }

    return result.data;
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    this.logger.debug('Removendo tipo de certidão', { id });

    const result = await this.removeCertificateTypeUseCase.execute(id);

    if (!result.success) {
      throw new BadRequestException(result.error);
    }
  }
}
