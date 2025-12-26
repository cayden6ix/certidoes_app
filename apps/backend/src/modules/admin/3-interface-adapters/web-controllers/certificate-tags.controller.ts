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
import { CurrentUser } from '../../../auth/3-interface-adapters/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../../auth/3-interface-adapters/types/express-request.types';

import type { ListTagsUseCase } from '../../2-application/use-cases/certificate-tags/list-tags.usecase';
import type { CreateTagUseCase } from '../../2-application/use-cases/certificate-tags/create-tag.usecase';
import type { UpdateTagUseCase } from '../../2-application/use-cases/certificate-tags/update-tag.usecase';
import type { RemoveTagUseCase } from '../../2-application/use-cases/certificate-tags/remove-tag.usecase';
import type { UpdateCertificateTagsUseCase } from '../../2-application/use-cases/certificate-tags/update-certificate-tags.usecase';

import {
  LIST_TAGS_USECASE,
  CREATE_TAG_USECASE,
  UPDATE_TAG_USECASE,
  REMOVE_TAG_USECASE,
  UPDATE_CERTIFICATE_TAGS_USECASE,
} from '../../4-infrastructure/di/admin.tokens';

import {
  CreateTagDto,
  ListTagsQueryDto,
  UpdateCertificateTagsDto,
  UpdateTagDto,
} from '../api-dto/tags.dto';

/**
 * Controller para gerenciamento de tags de certidão
 * Segue o padrão de Interface Adapters da Clean Architecture
 */
@Controller('admin/certificate-tags')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class CertificateTagsController {
  constructor(
    @Inject(LIST_TAGS_USECASE)
    private readonly listTagsUseCase: ListTagsUseCase,
    @Inject(CREATE_TAG_USECASE)
    private readonly createTagUseCase: CreateTagUseCase,
    @Inject(UPDATE_TAG_USECASE)
    private readonly updateTagUseCase: UpdateTagUseCase,
    @Inject(REMOVE_TAG_USECASE)
    private readonly removeTagUseCase: RemoveTagUseCase,
    @Inject(UPDATE_CERTIFICATE_TAGS_USECASE)
    private readonly updateCertificateTagsUseCase: UpdateCertificateTagsUseCase,
    @Inject(LOGGER_CONTRACT)
    private readonly logger: LoggerContract,
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

    const result = await this.listTagsUseCase.execute({
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
  async create(@Body() dto: CreateTagDto, @CurrentUser() user: AuthenticatedUser) {
    this.logger.debug('Criando tag', { name: dto.name, userId: user.userId });

    const result = await this.createTagUseCase.execute({
      name: dto.name,
      color: dto.color ?? null,
    });

    if (!result.success) {
      throw new BadRequestException(result.error);
    }

    return result.data;
  }

  @Patch(':id')
  @HttpCode(200)
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateTagDto) {
    this.logger.debug('Atualizando tag', { id, fields: Object.keys(dto) });

    const result = await this.updateTagUseCase.execute(id, dto);

    if (!result.success) {
      throw new BadRequestException(result.error);
    }

    return result.data;
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    this.logger.debug('Removendo tag', { id });

    const result = await this.removeTagUseCase.execute(id);

    if (!result.success) {
      throw new BadRequestException(result.error);
    }
  }

  /**
   * Atualiza as tags de um certificado específico
   */
  @Post('certificates/:certificateId')
  @HttpCode(200)
  async updateCertificateTags(
    @Param('certificateId', ParseUUIDPipe) certificateId: string,
    @Body() dto: UpdateCertificateTagsDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    this.logger.debug('Atualizando tags do certificado', {
      certificateId,
      tagIds: dto.tagIds,
      userId: user.userId,
    });

    const result = await this.updateCertificateTagsUseCase.execute(
      certificateId,
      dto.tagIds,
      user.userId,
    );

    if (!result.success) {
      throw new BadRequestException(result.error);
    }

    return { success: true };
  }
}
