import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  Inject,
  HttpCode,
  ParseUUIDPipe,
} from '@nestjs/common';
import type { LoggerContract } from '../../../../shared/1-domain/contracts/logger.contract';
import { LOGGER_CONTRACT } from '../../../../shared/1-domain/contracts/logger.contract';
import {
  CREATE_CERTIFICATE_USECASE,
  LIST_CERTIFICATES_USECASE,
  GET_CERTIFICATE_USECASE,
  UPDATE_CERTIFICATE_USECASE,
  LIST_CERTIFICATE_EVENTS_USECASE,
} from '../../4-infrastructure/di/certificates.tokens';
import type { CreateCertificateUseCase } from '../../2-application/use-cases/create-certificate.usecase';
import type { ListCertificatesUseCase } from '../../2-application/use-cases/list-certificates.usecase';
import type { GetCertificateUseCase } from '../../2-application/use-cases/get-certificate.usecase';
import type { UpdateCertificateUseCase } from '../../2-application/use-cases/update-certificate.usecase';
import type { ListCertificateEventsUseCase } from '../../2-application/use-cases/list-certificate-events.usecase';
import { CreateCertificateRequestDto } from '../../2-application/dto/create-certificate-request.dto';
import { ListCertificatesRequestDto } from '../../2-application/dto/list-certificates-request.dto';
import { UpdateCertificateRequestDto } from '../../2-application/dto/update-certificate-request.dto';
import { ListCertificateEventsRequestDto } from '../../2-application/dto/list-certificate-events-request.dto';
import { JwtAuthGuard } from '../../../auth/3-interface-adapters/guards/jwt-auth.guard';
import { CurrentUser } from '../../../auth/3-interface-adapters/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../../auth/3-interface-adapters/types/express-request.types';
import { CreateCertificateApiDto } from '../api-dto/create-certificate.dto';
import { UpdateCertificateAdminApiDto } from '../api-dto/update-certificate.dto';
import { ListCertificatesQueryDto } from '../api-dto/list-certificates-query.dto';
import { CertificateResultToHttpHelper } from '../helpers/certificate-result-to-http.helper';

/**
 * Controller de certidões
 * Implementa endpoints CRUD para certidões
 * Todas as rotas são protegidas por JwtAuthGuard
 */
@Controller('certificates')
@UseGuards(JwtAuthGuard)
export class CertificatesController {
  constructor(
    @Inject(CREATE_CERTIFICATE_USECASE)
    private readonly createCertificateUseCase: CreateCertificateUseCase,
    @Inject(LIST_CERTIFICATES_USECASE)
    private readonly listCertificatesUseCase: ListCertificatesUseCase,
    @Inject(GET_CERTIFICATE_USECASE)
    private readonly getCertificateUseCase: GetCertificateUseCase,
    @Inject(UPDATE_CERTIFICATE_USECASE)
    private readonly updateCertificateUseCase: UpdateCertificateUseCase,
    @Inject(LIST_CERTIFICATE_EVENTS_USECASE)
    private readonly listCertificateEventsUseCase: ListCertificateEventsUseCase,
    @Inject(LOGGER_CONTRACT)
    private readonly logger: LoggerContract,
  ) {}

  /**
   * Cria uma nova certidão
   * POST /certificates (com prefixo global: /api/certificates)
   * @param dto - Dados da certidão
   * @param user - Usuário autenticado
   * @returns Certidão criada
   */
  @Post()
  @HttpCode(201)
  async create(
    @Body() dto: CreateCertificateApiDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    this.logger.debug('Requisição de criação de certidão', {
      userId: user.userId,
      certificateType: dto.certificateType,
    });

    const request = new CreateCertificateRequestDto(
      user.userId,
      user.role,
      dto.certificateType,
      dto.recordNumber,
      dto.partiesName,
      dto.notes ?? null,
      dto.priority ?? 'normal',
    );

    const result = await this.createCertificateUseCase.execute(request);
    const certificate = CertificateResultToHttpHelper.handle(result);

    return certificate.toDTO();
  }

  /**
   * Lista certidões
   * GET /certificates (com prefixo global: /api/certificates)
   * Cliente: apenas suas certidões
   * Admin: todas as certidões
   * @param query - Filtros de listagem
   * @param user - Usuário autenticado
   * @returns Lista paginada de certidões
   */
  @Get()
  @HttpCode(200)
  async findAll(
    @Query() query: ListCertificatesQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    this.logger.debug('Requisição de listagem de certidões', {
      userId: user.userId,
      userRole: user.role,
      filters: query,
    });

    const request = new ListCertificatesRequestDto(user.userId, user.role, {
      status: query.status,
      priority: query.priority,
      limit: query.limit,
      offset: query.offset,
    });

    const result = await this.listCertificatesUseCase.execute(request);
    const paginated = CertificateResultToHttpHelper.handle(result);

    return {
      data: paginated.data.map((cert) => cert.toDTO()),
      total: paginated.total,
      limit: paginated.limit,
      offset: paginated.offset,
    };
  }

  /**
   * Obtém uma certidão específica
   * GET /certificates/:id (com prefixo global: /api/certificates/:id)
   * Cliente: apenas se for dono
   * Admin: qualquer certidão
   * @param id - ID da certidão (UUID)
   * @param user - Usuário autenticado
   * @returns Certidão encontrada
   */
  @Get(':id')
  @HttpCode(200)
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    this.logger.debug('Requisição de busca de certidão', {
      certificateId: id,
      userId: user.userId,
      userRole: user.role,
    });

    const result = await this.getCertificateUseCase.execute({
      certificateId: id,
      userId: user.userId,
      userRole: user.role,
    });

    const certificate = CertificateResultToHttpHelper.handle(result);

    return certificate.toDTO();
  }

  /**
   * Lista eventos de uma certidão
   * GET /certificates/:id/events (com prefixo global: /api/certificates/:id/events)
   * Cliente: apenas se for dono
   * Admin: qualquer certidão
   * @param id - ID da certidão (UUID)
   * @param user - Usuário autenticado
   * @returns Lista de eventos da certidão
   */
  @Get(':id/events')
  @HttpCode(200)
  async listEvents(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    this.logger.debug('Requisição de eventos da certidão', {
      certificateId: id,
      userId: user.userId,
      userRole: user.role,
    });

    const request = new ListCertificateEventsRequestDto(id, user.userId, user.role);
    const result = await this.listCertificateEventsUseCase.execute(request);
    const events = CertificateResultToHttpHelper.handle(result);

    return events.map((event) => event.toDTO());
  }

  /**
   * Atualiza uma certidão
   * PATCH /certificates/:id (com prefixo global: /api/certificates/:id)
   * Cliente: pode atualizar campos não-administrativos das próprias certidões
   * Admin: pode atualizar todos os campos de qualquer certidão
   * @param id - ID da certidão (UUID)
   * @param dto - Dados de atualização
   * @param user - Usuário autenticado
   * @returns Certidão atualizada
   */
  @Patch(':id')
  @HttpCode(200)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCertificateAdminApiDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    this.logger.debug('Requisição de atualização de certidão', {
      certificateId: id,
      userId: user.userId,
      userRole: user.role,
      updateFields: Object.keys(dto),
    });

    const request = new UpdateCertificateRequestDto(id, user.userId, user.role, {
      certificateType: dto.certificateType,
      recordNumber: dto.recordNumber,
      partiesName: dto.partiesName,
      notes: dto.notes,
      priority: dto.priority,
      status: dto.status,
      cost: dto.cost,
      additionalCost: dto.additionalCost,
      orderNumber: dto.orderNumber,
      paymentDate: dto.paymentDate ? new Date(dto.paymentDate) : undefined,
    });

    const result = await this.updateCertificateUseCase.execute(request);
    const certificate = CertificateResultToHttpHelper.handle(result);

    return certificate.toDTO();
  }
}
