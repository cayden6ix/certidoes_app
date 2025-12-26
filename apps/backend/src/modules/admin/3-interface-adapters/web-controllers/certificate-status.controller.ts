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
import { CurrentUser } from '../../../auth/3-interface-adapters/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../../auth/3-interface-adapters/types/express-request.types';
import { CertificateStatusService } from '../../2-application/services/certificate-status.service';
import {
  CreateCertificateStatusDto,
  ListCertificateStatusQueryDto,
  UpdateCertificateStatusDto,
} from '../api-dto/certificate-status.dto';

@Controller('admin/certificate-statuses')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class CertificateStatusController {
  constructor(
    private readonly certificateStatusService: CertificateStatusService,
    @Inject(LOGGER_CONTRACT) private readonly logger: LoggerContract,
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

    const result = await this.certificateStatusService.list({
      search: query.search,
      includeInactive: query.includeInactive,
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

  /**
   * Busca um status por ID
   */
  @Get(':id')
  @HttpCode(200)
  async findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.certificateStatusService.findById(id);
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

    return this.certificateStatusService.create({
      name: dto.name,
      displayName: dto.displayName,
      description: dto.description,
      color: dto.color,
      displayOrder: dto.displayOrder,
      canEditCertificate: dto.canEditCertificate,
      isFinal: dto.isFinal,
    });
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

    return this.certificateStatusService.update(id, {
      displayName: dto.displayName,
      description: dto.description,
      color: dto.color,
      displayOrder: dto.displayOrder,
      isActive: dto.isActive,
      canEditCertificate: dto.canEditCertificate,
      isFinal: dto.isFinal,
    });
  }

  /**
   * Remove um status
   */
  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    this.logger.debug('Removendo status de certidão', { id });
    await this.certificateStatusService.remove(id);
  }
}
