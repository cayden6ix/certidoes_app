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
import { PaymentTypesService } from '../../2-application/services/payment-types.service';
import {
  CreatePaymentTypeDto,
  ListPaymentTypesQueryDto,
  UpdatePaymentTypeDto,
} from '../api-dto/payment-types.dto';

@Controller('admin/payment-types')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class PaymentTypesController {
  constructor(
    private readonly paymentTypesService: PaymentTypesService,
    @Inject(LOGGER_CONTRACT) private readonly logger: LoggerContract,
  ) {}

  @Get()
  @HttpCode(200)
  async list(@Query() query: ListPaymentTypesQueryDto) {
    const pagination = PaginationService.normalize({
      page: query.page,
      pageSize: query.pageSize,
      limit: query.limit,
      offset: query.offset,
    });

    const result = await this.paymentTypesService.list({
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
  async create(@Body() dto: CreatePaymentTypeDto) {
    this.logger.debug('Criando forma de pagamento', { name: dto.name });
    return this.paymentTypesService.create({
      name: dto.name,
      enabled: dto.enabled ?? true,
    });
  }

  @Patch(':id')
  @HttpCode(200)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePaymentTypeDto,
  ) {
    this.logger.debug('Atualizando forma de pagamento', { id, fields: Object.keys(dto) });
    return this.paymentTypesService.update(id, {
      name: dto.name,
      enabled: dto.enabled,
    });
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    this.logger.debug('Removendo forma de pagamento', { id });
    await this.paymentTypesService.remove(id);
  }
}
