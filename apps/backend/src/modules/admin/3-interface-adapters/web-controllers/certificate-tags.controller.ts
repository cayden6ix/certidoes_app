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
import { CertificateTagsService } from '../../2-application/services/certificate-tags.service';
import { CreateTagDto, ListTagsQueryDto, UpdateTagDto } from '../api-dto/tags.dto';

@Controller('admin/certificate-tags')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class CertificateTagsController {
  constructor(
    private readonly certificateTagsService: CertificateTagsService,
    @Inject(LOGGER_CONTRACT) private readonly logger: LoggerContract,
  ) {}

  @Get()
  @HttpCode(200)
  async list(@Query() query: ListTagsQueryDto) {
    const pagination = PaginationService.normalize({
      page: query.page,
      pageSize: query.pageSize,
      limit: query.limit,
      offset: query.offset,
    });

    const result = await this.certificateTagsService.list({
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
  async create(@Body() dto: CreateTagDto, @CurrentUser() user: AuthenticatedUser) {
    this.logger.debug('Criando tag', { name: dto.name, userId: user.userId });
    return this.certificateTagsService.create({
      name: dto.name,
      color: dto.color ?? null,
    });
  }

  @Patch(':id')
  @HttpCode(200)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTagDto,
  ) {
    this.logger.debug('Atualizando tag', { id, fields: Object.keys(dto) });
    return this.certificateTagsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    this.logger.debug('Removendo tag', { id });
    await this.certificateTagsService.remove(id);
  }
}
