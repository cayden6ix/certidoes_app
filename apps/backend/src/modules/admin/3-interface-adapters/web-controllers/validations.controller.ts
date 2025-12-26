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
import { ValidationsService } from '../../2-application/services/validations.service';
import {
  CreateValidationDto,
  ListValidationQueryDto,
  UpdateValidationDto,
} from '../api-dto/validation.dto';

@Controller('admin/validations')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class ValidationsController {
  constructor(
    private readonly validationsService: ValidationsService,
    @Inject(LOGGER_CONTRACT) private readonly logger: LoggerContract,
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

    const result = await this.validationsService.list({
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

  @Post()
  @HttpCode(201)
  async create(@Body() dto: CreateValidationDto) {
    this.logger.debug('Criando validação', { name: dto.name });
    return this.validationsService.create({
      name: dto.name,
      description: dto.description,
      isActive: dto.isActive,
    });
  }

  @Patch(':id')
  @HttpCode(200)
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateValidationDto) {
    this.logger.debug('Atualizando validação', { id, fields: Object.keys(dto) });
    return this.validationsService.update(id, {
      name: dto.name,
      description: dto.description,
      isActive: dto.isActive,
    });
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    this.logger.debug('Removendo validação', { id });
    await this.validationsService.remove(id);
  }
}
