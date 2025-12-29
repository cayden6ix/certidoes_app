import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Inject,
  HttpCode,
  ParseUUIDPipe,
  BadRequestException,
} from '@nestjs/common';
import type { LoggerContract } from '../../../../shared/1-domain/contracts/logger.contract';
import { LOGGER_CONTRACT } from '../../../../shared/1-domain/contracts/logger.contract';
import { PaginationService } from '../../../../shared/2-application/services/pagination.service';
import {
  CREATE_CERTIFICATE_USECASE,
  LIST_CERTIFICATES_USECASE,
  GET_CERTIFICATE_USECASE,
  UPDATE_CERTIFICATE_USECASE,
  LIST_CERTIFICATE_EVENTS_USECASE,
  CREATE_COMMENT_USECASE,
  LIST_COMMENTS_USECASE,
  DELETE_COMMENT_USECASE,
} from '../../4-infrastructure/di/certificates.tokens';
import type { CreateCertificateUseCase } from '../../2-application/use-cases/create-certificate.usecase';
import type { ListCertificatesUseCase } from '../../2-application/use-cases/list-certificates.usecase';
import type { GetCertificateUseCase } from '../../2-application/use-cases/get-certificate.usecase';
import type { UpdateCertificateUseCase } from '../../2-application/use-cases/update-certificate.usecase';
import type { ListCertificateEventsUseCase } from '../../2-application/use-cases/list-certificate-events.usecase';
import type { CreateCommentUseCase } from '../../2-application/use-cases/comments/create-comment.usecase';
import type { ListCommentsUseCase } from '../../2-application/use-cases/comments/list-comments.usecase';
import type { DeleteCommentUseCase } from '../../2-application/use-cases/comments/delete-comment.usecase';
import { CreateCertificateRequestDto } from '../../2-application/dto/create-certificate-request.dto';
import { ListCertificatesRequestDto } from '../../2-application/dto/list-certificates-request.dto';
import { UpdateCertificateRequestDto } from '../../2-application/dto/update-certificate-request.dto';
import { ListCertificateEventsRequestDto } from '../../2-application/dto/list-certificate-events-request.dto';
import {
  CreateCommentRequestDto,
  ListCommentsRequestDto,
  DeleteCommentRequestDto,
} from '../../2-application/dto/comment-request.dto';
import type { ListCertificateTypesUseCase } from '../../../admin/2-application/use-cases/certificate-types/list-certificate-types.usecase';
import { LIST_CERTIFICATE_TYPES_USECASE } from '../../../admin/4-infrastructure/di/admin.tokens';
import { JwtAuthGuard } from '../../../auth/3-interface-adapters/guards/jwt-auth.guard';
import { CurrentUser } from '../../../auth/3-interface-adapters/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../../auth/3-interface-adapters/types/express-request.types';
import { CreateCertificateApiDto } from '../api-dto/create-certificate.dto';
import { UpdateCertificateAdminApiDto } from '../api-dto/update-certificate.dto';
import { ListCertificatesQueryDto } from '../api-dto/list-certificates-query.dto';
import { CreateCommentApiDto } from '../api-dto/create-comment.dto';
import { CertificateResultToHttpHelper } from '../helpers/certificate-result-to-http.helper';
import { ListCertificateTypesQueryDto } from '../../../admin/3-interface-adapters/api-dto/certificate-types.dto';

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
    @Inject(LIST_CERTIFICATE_TYPES_USECASE)
    private readonly listCertificateTypesUseCase: ListCertificateTypesUseCase,
    @Inject(CREATE_COMMENT_USECASE)
    private readonly createCommentUseCase: CreateCommentUseCase,
    @Inject(LIST_COMMENTS_USECASE)
    private readonly listCommentsUseCase: ListCommentsUseCase,
    @Inject(DELETE_COMMENT_USECASE)
    private readonly deleteCommentUseCase: DeleteCommentUseCase,
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
  async create(@Body() dto: CreateCertificateApiDto, @CurrentUser() user: AuthenticatedUser) {
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
  async findAll(@Query() query: ListCertificatesQueryDto, @CurrentUser() user: AuthenticatedUser) {
    this.logger.debug('Requisição de listagem de certidões', {
      userId: user.userId,
      userRole: user.role,
      filters: query,
    });

    // Delega lógica de paginação para o serviço especializado
    const pagination = PaginationService.normalize({
      page: query.page,
      pageSize: query.pageSize,
      limit: query.limit,
      offset: query.offset,
    });

    const request = new ListCertificatesRequestDto(user.userId, user.role, {
      search: query.search,
      from: query.from,
      to: query.to,
      status: query.status,
      priority: query.priority,
      limit: pagination.limit,
      offset: pagination.offset,
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

  @Get('types')
  @HttpCode(200)
  async listTypes(@Query() query: ListCertificateTypesQueryDto) {
    this.logger.debug('Requisição de listagem de tipos de certidão', {
      search: query.search,
    });

    const pagination = PaginationService.normalize({
      page: query.page,
      pageSize: query.pageSize,
      limit: query.limit,
      offset: query.offset,
    });

    const result = await this.listCertificateTypesUseCase.execute({
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
  async findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthenticatedUser) {
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
  async listEvents(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthenticatedUser) {
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

    const request = new UpdateCertificateRequestDto(
      id,
      user.userId,
      user.role,
      {
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
        paymentTypeId: dto.paymentTypeId === undefined ? undefined : (dto.paymentTypeId ?? null),
      },
      {
        confirmed: dto.validationConfirmed,
        statement: dto.validationStatement,
      },
    );

    const result = await this.updateCertificateUseCase.execute(request);
    const certificate = CertificateResultToHttpHelper.handle(result);

    return certificate.toDTO();
  }

  // ============ COMENTÁRIOS ============

  /**
   * Lista comentários de uma certidão
   * GET /certificates/:id/comments
   * Cliente: apenas se for dono
   * Admin: qualquer certidão
   * @param id - ID da certidão (UUID)
   * @param user - Usuário autenticado
   * @returns Lista de comentários ordenados cronologicamente
   */
  @Get(':id/comments')
  @HttpCode(200)
  async listComments(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    this.logger.debug('Requisição de listagem de comentários', {
      certificateId: id,
      userId: user.userId,
      userRole: user.role,
    });

    const request = new ListCommentsRequestDto(id, user.userId, user.role);
    const result = await this.listCommentsUseCase.execute(request);
    const comments = CertificateResultToHttpHelper.handle(result);

    return comments.map((comment) => comment.toDTO());
  }

  /**
   * Cria um comentário em uma certidão
   * POST /certificates/:id/comments
   * Cliente: apenas em suas certidões
   * Admin: qualquer certidão
   * @param id - ID da certidão (UUID)
   * @param dto - Dados do comentário
   * @param user - Usuário autenticado
   * @returns Comentário criado
   */
  @Post(':id/comments')
  @HttpCode(201)
  async createComment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateCommentApiDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    this.logger.debug('Requisição de criação de comentário', {
      certificateId: id,
      userId: user.userId,
      userRole: user.role,
    });

    const request = new CreateCommentRequestDto(
      id,
      user.userId,
      user.role,
      user.email,
      dto.content,
    );

    const result = await this.createCommentUseCase.execute(request);
    const comment = CertificateResultToHttpHelper.handle(result);

    return comment.toDTO();
  }

  /**
   * Deleta um comentário de uma certidão
   * DELETE /certificates/:id/comments/:commentId
   * Apenas admins podem deletar comentários (moderação)
   * @param id - ID da certidão (UUID)
   * @param commentId - ID do comentário (UUID)
   * @param user - Usuário autenticado
   */
  @Delete(':id/comments/:commentId')
  @HttpCode(204)
  async deleteComment(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('commentId', ParseUUIDPipe) commentId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    this.logger.debug('Requisição de deleção de comentário', {
      certificateId: id,
      commentId,
      userId: user.userId,
      userRole: user.role,
    });

    const request = new DeleteCommentRequestDto(commentId, id, user.userId, user.role);
    const result = await this.deleteCommentUseCase.execute(request);
    CertificateResultToHttpHelper.handle(result);
  }
}
