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
import { CertificateStatusValidationsService } from '../../2-application/services/certificate-status-validations.service';
import {
  CreateCertificateStatusValidationDto,
  ListCertificateStatusValidationQueryDto,
  UpdateCertificateStatusValidationDto,
} from '../api-dto/certificate-status-validation.dto';

@Controller('admin/certificate-status-validations')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class CertificateStatusValidationsController {
  constructor(
    private readonly certificateStatusValidationsService: CertificateStatusValidationsService,
    @Inject(LOGGER_CONTRACT) private readonly logger: LoggerContract,
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

    const result = await this.certificateStatusValidationsService.list({
      statusId: query.statusId,
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
  async create(@Body() dto: CreateCertificateStatusValidationDto) {
    this.logger.debug('Criando validação por status', {
      statusId: dto.statusId,
      validationId: dto.validationId,
    });

    return this.certificateStatusValidationsService.create({
      statusId: dto.statusId,
      validationId: dto.validationId,
      requiredField: dto.requiredField ?? null,
      confirmationText: dto.confirmationText ?? null,
    });
  }

  @Patch(':id')
  @HttpCode(200)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCertificateStatusValidationDto,
  ) {
    this.logger.debug('Atualizando validação por status', { id, fields: Object.keys(dto) });
    return this.certificateStatusValidationsService.update(id, {
      statusId: dto.statusId,
      validationId: dto.validationId,
      requiredField: dto.requiredField ?? null,
      confirmationText: dto.confirmationText ?? null,
    });
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    this.logger.debug('Removendo validação por status', { id });
    await this.certificateStatusValidationsService.remove(id);
  }
}
