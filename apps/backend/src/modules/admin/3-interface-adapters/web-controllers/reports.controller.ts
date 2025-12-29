import {
  BadRequestException,
  Controller,
  Get,
  HttpCode,
  Inject,
  Query,
  UseGuards,
} from '@nestjs/common';

import type { LoggerContract } from '../../../../shared/1-domain/contracts/logger.contract';
import { LOGGER_CONTRACT } from '../../../../shared/1-domain/contracts/logger.contract';
import { PaginationService } from '../../../../shared/2-application/services/pagination.service';
import { JwtAuthGuard } from '../../../auth/3-interface-adapters/guards/jwt-auth.guard';
import { RolesGuard } from '../../../auth/3-interface-adapters/guards/roles.guard';
import { Roles } from '../../../auth/3-interface-adapters/decorators/roles.decorator';

import type { GetReportMetricsUseCase } from '../../2-application/use-cases/reports/get-report-metrics.usecase';
import type { GetReportCertificatesUseCase } from '../../2-application/use-cases/reports/get-report-certificates.usecase';

import {
  GET_REPORT_METRICS_USECASE,
  GET_REPORT_CERTIFICATES_USECASE,
} from '../../4-infrastructure/di/admin.tokens';

import { ReportQueryDto } from '../api-dto/report.dto';

/**
 * Controller de relatórios administrativos
 * Fornece endpoints para métricas agregadas e listagem filtrada de certidões
 * Acesso restrito a administradores
 */
@Controller('admin/reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class ReportsController {
  constructor(
    @Inject(GET_REPORT_METRICS_USECASE)
    private readonly getMetricsUseCase: GetReportMetricsUseCase,
    @Inject(GET_REPORT_CERTIFICATES_USECASE)
    private readonly getCertificatesUseCase: GetReportCertificatesUseCase,
    @Inject(LOGGER_CONTRACT)
    private readonly logger: LoggerContract,
  ) {}

  /**
   * Retorna métricas agregadas para o dashboard de relatórios
   * Inclui totais, quebras por status/tipo/período/prioridade
   *
   * @route GET /admin/reports/metrics
   */
  @Get('metrics')
  @HttpCode(200)
  async getMetrics(@Query() query: ReportQueryDto) {
    const activeFilters = this.getActiveFilters(query);

    this.logger.debug('Requisição de métricas de relatório', {
      activeFilters,
      filterCount: activeFilters.length,
    });

    const result = await this.getMetricsUseCase.execute({
      certificateTypeId: query.certificateTypeId,
      recordNumber: query.recordNumber,
      statusId: query.statusId,
      tagIds: query.tagIds,
      paymentTypeId: query.paymentTypeId,
      paymentDateFrom: query.paymentDateFrom,
      paymentDateTo: query.paymentDateTo,
      orderNumber: query.orderNumber,
      userId: query.userId,
      commentSearch: query.commentSearch,
      notesSearch: query.notesSearch,
      partiesNameSearch: query.partiesNameSearch,
    });

    if (!result.success) {
      throw new BadRequestException(result.error);
    }

    return result.data;
  }

  /**
   * Retorna lista paginada de certidões filtradas para exibição no relatório
   *
   * @route GET /admin/reports/certificates
   */
  @Get('certificates')
  @HttpCode(200)
  async getCertificates(@Query() query: ReportQueryDto) {
    const pagination = PaginationService.normalize({
      page: query.page,
      pageSize: query.pageSize,
      limit: query.limit,
      offset: query.offset,
    });

    const activeFilters = this.getActiveFilters(query);

    this.logger.debug('Requisição de certidões do relatório', {
      activeFilters,
      filterCount: activeFilters.length,
      limit: pagination.limit,
      offset: pagination.offset,
    });

    const result = await this.getCertificatesUseCase.execute({
      certificateTypeId: query.certificateTypeId,
      recordNumber: query.recordNumber,
      statusId: query.statusId,
      tagIds: query.tagIds,
      paymentTypeId: query.paymentTypeId,
      paymentDateFrom: query.paymentDateFrom,
      paymentDateTo: query.paymentDateTo,
      orderNumber: query.orderNumber,
      userId: query.userId,
      commentSearch: query.commentSearch,
      notesSearch: query.notesSearch,
      partiesNameSearch: query.partiesNameSearch,
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
   * Retorna lista de filtros ativos para logging
   */
  private getActiveFilters(query: ReportQueryDto): string[] {
    const filterKeys = [
      'certificateTypeId',
      'recordNumber',
      'statusId',
      'tagIds',
      'paymentTypeId',
      'paymentDateFrom',
      'paymentDateTo',
      'orderNumber',
      'userId',
      'commentSearch',
      'notesSearch',
      'partiesNameSearch',
    ] as const;

    return filterKeys.filter((key) => {
      const value = query[key];
      if (Array.isArray(value)) {
        return value.length > 0;
      }
      return value !== undefined && value !== '';
    });
  }
}
