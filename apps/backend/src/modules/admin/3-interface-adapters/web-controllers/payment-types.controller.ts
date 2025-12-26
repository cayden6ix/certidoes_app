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

import type { ListPaymentTypesUseCase } from '../../2-application/use-cases/payment-types/list-payment-types.usecase';
import type { CreatePaymentTypeUseCase } from '../../2-application/use-cases/payment-types/create-payment-type.usecase';
import type { UpdatePaymentTypeUseCase } from '../../2-application/use-cases/payment-types/update-payment-type.usecase';
import type { RemovePaymentTypeUseCase } from '../../2-application/use-cases/payment-types/remove-payment-type.usecase';

import {
  LIST_PAYMENT_TYPES_USECASE,
  CREATE_PAYMENT_TYPE_USECASE,
  UPDATE_PAYMENT_TYPE_USECASE,
  REMOVE_PAYMENT_TYPE_USECASE,
} from '../../4-infrastructure/di/admin.tokens';

import {
  CreatePaymentTypeDto,
  ListPaymentTypesQueryDto,
  UpdatePaymentTypeDto,
} from '../api-dto/payment-types.dto';

/**
 * Controller para gerenciamento de formas de pagamento
 * Segue o padrão de Interface Adapters da Clean Architecture
 */
@Controller('admin/payment-types')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class PaymentTypesController {
  constructor(
    @Inject(LIST_PAYMENT_TYPES_USECASE)
    private readonly listPaymentTypesUseCase: ListPaymentTypesUseCase,
    @Inject(CREATE_PAYMENT_TYPE_USECASE)
    private readonly createPaymentTypeUseCase: CreatePaymentTypeUseCase,
    @Inject(UPDATE_PAYMENT_TYPE_USECASE)
    private readonly updatePaymentTypeUseCase: UpdatePaymentTypeUseCase,
    @Inject(REMOVE_PAYMENT_TYPE_USECASE)
    private readonly removePaymentTypeUseCase: RemovePaymentTypeUseCase,
    @Inject(LOGGER_CONTRACT)
    private readonly logger: LoggerContract,
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

    const result = await this.listPaymentTypesUseCase.execute({
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
  async create(@Body() dto: CreatePaymentTypeDto) {
    this.logger.debug('Criando forma de pagamento', { name: dto.name });

    const result = await this.createPaymentTypeUseCase.execute({
      name: dto.name,
      enabled: dto.enabled ?? true,
    });

    if (!result.success) {
      throw new BadRequestException(result.error);
    }

    return result.data;
  }

  @Patch(':id')
  @HttpCode(200)
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdatePaymentTypeDto) {
    this.logger.debug('Atualizando forma de pagamento', { id, fields: Object.keys(dto) });

    const result = await this.updatePaymentTypeUseCase.execute(id, {
      name: dto.name,
      enabled: dto.enabled,
    });

    if (!result.success) {
      throw new BadRequestException(result.error);
    }

    return result.data;
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    this.logger.debug('Removendo forma de pagamento', { id });

    const result = await this.removePaymentTypeUseCase.execute(id);

    if (!result.success) {
      throw new BadRequestException(result.error);
    }
  }
}
