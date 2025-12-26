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
  UseGuards,
} from '@nestjs/common';

import type { LoggerContract } from '../../../../shared/1-domain/contracts/logger.contract';
import { LOGGER_CONTRACT } from '../../../../shared/1-domain/contracts/logger.contract';
import { PaginationService } from '../../../../shared/2-application/services/pagination.service';
import { JwtAuthGuard } from '../../../auth/3-interface-adapters/guards/jwt-auth.guard';
import { RolesGuard } from '../../../auth/3-interface-adapters/guards/roles.guard';
import { Roles } from '../../../auth/3-interface-adapters/decorators/roles.decorator';
import { CurrentUser } from '../../../auth/3-interface-adapters/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../../auth/3-interface-adapters/types/express-request.types';

import type { ListCertificateStatusUseCase } from '../../2-application/use-cases/certificate-status/list-certificate-status.usecase';
import type { FindCertificateStatusByIdUseCase } from '../../2-application/use-cases/certificate-status/find-certificate-status-by-id.usecase';
import type { CreateCertificateStatusUseCase } from '../../2-application/use-cases/certificate-status/create-certificate-status.usecase';
import type { UpdateCertificateStatusUseCase } from '../../2-application/use-cases/certificate-status/update-certificate-status.usecase';
import type { RemoveCertificateStatusUseCase } from '../../2-application/use-cases/certificate-status/remove-certificate-status.usecase';

import {
  LIST_CERTIFICATE_STATUS_USECASE,
  FIND_CERTIFICATE_STATUS_BY_ID_USECASE,
  CREATE_CERTIFICATE_STATUS_USECASE,
  UPDATE_CERTIFICATE_STATUS_USECASE,
  REMOVE_CERTIFICATE_STATUS_USECASE,
} from '../../4-infrastructure/di/admin.tokens';

import {
  CreateCertificateStatusDto,
  ListCertificateStatusQueryDto,
  UpdateCertificateStatusDto,
} from '../api-dto/certificate-status.dto';

/**
 * Controller para gerenciamento de status de certidão
 * Segue o padrão de Interface Adapters da Clean Architecture
 */
@Controller('admin/certificate-statuses')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class CertificateStatusController {
  constructor(
    @Inject(LIST_CERTIFICATE_STATUS_USECASE)
    private readonly listCertificateStatusUseCase: ListCertificateStatusUseCase,
    @Inject(FIND_CERTIFICATE_STATUS_BY_ID_USECASE)
    private readonly findCertificateStatusByIdUseCase: FindCertificateStatusByIdUseCase,
    @Inject(CREATE_CERTIFICATE_STATUS_USECASE)
    private readonly createCertificateStatusUseCase: CreateCertificateStatusUseCase,
    @Inject(UPDATE_CERTIFICATE_STATUS_USECASE)
    private readonly updateCertificateStatusUseCase: UpdateCertificateStatusUseCase,
    @Inject(REMOVE_CERTIFICATE_STATUS_USECASE)
    private readonly removeCertificateStatusUseCase: RemoveCertificateStatusUseCase,
    @Inject(LOGGER_CONTRACT)
    private readonly logger: LoggerContract,
  ) {}

  /**
   * Lista todos os status de certidão
   */
  @Get()
  @HttpCode(200)
  async list(@Query() query: ListCertificateStatusQueryDto) {
    const pagination = PaginationService.normalize({
      page: query.page,
      pageSize: query.pageSize,
      limit: query.limit,
      offset: query.offset,
    });

    const result = await this.listCertificateStatusUseCase.execute({
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

  /**
   * Busca um status por ID
   */
  @Get(':id')
  @HttpCode(200)
  async findById(@Param('id', ParseUUIDPipe) id: string) {
    const result = await this.findCertificateStatusByIdUseCase.execute(id);

    if (!result.success) {
      throw new BadRequestException(result.error);
    }

    if (result.data === null) {
      throw new NotFoundException('Status não encontrado');
    }

    return result.data;
  }

  /**
   * Cria um novo status
   */
  @Post()
  @HttpCode(201)
  async create(@Body() dto: CreateCertificateStatusDto, @CurrentUser() user: AuthenticatedUser) {
    this.logger.debug('Criando status de certidão', {
      name: dto.name,
      displayName: dto.displayName,
      userId: user.userId,
    });

    const result = await this.createCertificateStatusUseCase.execute({
      name: dto.name,
      displayName: dto.displayName,
      description: dto.description,
      color: dto.color,
      displayOrder: dto.displayOrder,
      canEditCertificate: dto.canEditCertificate,
      isFinal: dto.isFinal,
    });

    if (!result.success) {
      throw new BadRequestException(result.error);
    }

    return result.data;
  }

  /**
   * Atualiza um status existente
   */
  @Patch(':id')
  @HttpCode(200)
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateCertificateStatusDto) {
    this.logger.debug('Atualizando status de certidão', {
      id,
      fields: Object.keys(dto),
    });

    const result = await this.updateCertificateStatusUseCase.execute(id, {
      displayName: dto.displayName,
      description: dto.description,
      color: dto.color,
      displayOrder: dto.displayOrder,
      isActive: dto.isActive,
      canEditCertificate: dto.canEditCertificate,
      isFinal: dto.isFinal,
    });

    if (!result.success) {
      throw new BadRequestException(result.error);
    }

    return result.data;
  }

  /**
   * Remove um status
   */
  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    this.logger.debug('Removendo status de certidão', { id });

    const result = await this.removeCertificateStatusUseCase.execute(id);

    if (!result.success) {
      throw new BadRequestException(result.error);
    }
  }
}
