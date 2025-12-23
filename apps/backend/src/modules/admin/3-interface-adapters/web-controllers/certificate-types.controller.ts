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
import { CertificateTypesService } from '../../2-application/services/certificate-types.service';
import {
  CreateCertificateTypeDto,
  ListCertificateTypesQueryDto,
  UpdateCertificateTypeDto,
} from '../api-dto/certificate-types.dto';

@Controller('admin/certificate-types')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class CertificateTypesController {
  constructor(
    private readonly certificateTypesService: CertificateTypesService,
    @Inject(LOGGER_CONTRACT) private readonly logger: LoggerContract,
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

    const result = await this.certificateTypesService.list({
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
  async create(@Body() dto: CreateCertificateTypeDto) {
    this.logger.debug('Criando tipo de certidão', { name: dto.name });
    return this.certificateTypesService.create({
      name: dto.name,
    });
  }

  @Patch(':id')
  @HttpCode(200)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCertificateTypeDto,
  ) {
    this.logger.debug('Atualizando tipo de certidão', { id, fields: Object.keys(dto) });
    return this.certificateTypesService.update(id, {
      name: dto.name,
    });
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    this.logger.debug('Removendo tipo de certidão', { id });
    await this.certificateTypesService.remove(id);
  }
}
