import { ConfigService } from '@nestjs/config';
import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Result } from '../../../../shared/1-domain/types/result.type';
import { failure, success } from '../../../../shared/1-domain/types/result.type';
import type { LoggerContract } from '../../../../shared/1-domain/contracts/logger.contract';
import type {
  CertificateRepositoryContract,
  CreateCertificateData,
  UpdateCertificateData,
  ListCertificatesOptions,
  PaginatedCertificates,
} from '../../1-domain/contracts/certificate.repository.contract';
import { CertificateEntity } from '../../1-domain/entities/certificate.entity';
import { CertificateStatusValueObject } from '../../1-domain/value-objects/certificate-status.value-object';
import { CertificatePriorityValueObject } from '../../1-domain/value-objects/certificate-priority.value-object';
import { CertificateError } from '../../1-domain/errors/certificate-errors.enum';

/**
 * Interface para tipagem da linha de certificate do banco
 */
interface CertificateRow {
  id: string;
  user_id: string;
  certificate_type: string;
  record_number: string;
  parties_name: string;
  notes: string | null;
  priority: 'normal' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'canceled';
  cost: number | null;
  additional_cost: number | null;
  order_number: string | null;
  payment_date: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Implementação de repositório de certidões com Supabase
 * Usa serviceRoleKey para bypass de RLS (controle de permissões no backend)
 */
export class SupabaseCertificateRepository implements CertificateRepositoryContract {
  private supabaseClient: SupabaseClient;

  constructor(
    private readonly configService: ConfigService,
    private readonly logger: LoggerContract,
  ) {
    const supabaseUrl = this.configService.get<string>('supabase.url');
    const supabaseServiceRoleKey = this.configService.get<string>('supabase.serviceRoleKey');

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error('Variáveis de ambiente do Supabase não configuradas');
    }

    this.supabaseClient = createClient(supabaseUrl, supabaseServiceRoleKey);
    this.logger.debug('Repositório de certidões Supabase inicializado');
  }

  /**
   * Cria uma nova certidão
   */
  async create(data: CreateCertificateData): Promise<Result<CertificateEntity>> {
    try {
      const { data: insertedData, error } = await this.supabaseClient
        .from('certificates')
        .insert({
          user_id: data.userId,
          certificate_type: data.certificateType,
          record_number: data.recordNumber,
          parties_name: data.partiesName,
          notes: data.notes ?? null,
          priority: data.priority ?? 'normal',
        })
        .select()
        .single<CertificateRow>();

      if (error || !insertedData) {
        this.logger.error('Erro ao criar certidão no banco', {
          error: error?.message,
          userId: data.userId,
        });
        return failure(CertificateError.DATABASE_ERROR);
      }

      const entity = this.mapToEntity(insertedData);
      if (!entity) {
        return failure(CertificateError.UNEXPECTED_ERROR);
      }

      return success(entity);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      this.logger.error('Erro crítico ao criar certidão', { error: errorMessage });
      return failure(CertificateError.DATABASE_ERROR);
    }
  }

  /**
   * Busca certidão por ID
   */
  async findById(id: string): Promise<Result<CertificateEntity>> {
    try {
      const { data, error } = await this.supabaseClient
        .from('certificates')
        .select('*')
        .eq('id', id)
        .single<CertificateRow>();

      if (error || !data) {
        if (error?.code === 'PGRST116') {
          return failure(CertificateError.CERTIFICATE_NOT_FOUND);
        }
        this.logger.error('Erro ao buscar certidão', { error: error?.message, id });
        return failure(CertificateError.DATABASE_ERROR);
      }

      const entity = this.mapToEntity(data);
      if (!entity) {
        return failure(CertificateError.UNEXPECTED_ERROR);
      }

      return success(entity);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      this.logger.error('Erro crítico ao buscar certidão', { error: errorMessage, id });
      return failure(CertificateError.DATABASE_ERROR);
    }
  }

  /**
   * Lista certidões com filtros
   */
  async findAll(options: ListCertificatesOptions): Promise<Result<PaginatedCertificates>> {
    try {
      let query = this.supabaseClient.from('certificates').select('*', { count: 'exact' });

      // Aplica filtros
      if (options.userId) {
        query = query.eq('user_id', options.userId);
      }
      if (options.status) {
        query = query.eq('status', options.status);
      }
      if (options.priority) {
        query = query.eq('priority', options.priority);
      }

      // Aplica paginação
      const limit = options.limit ?? 50;
      const offset = options.offset ?? 0;
      query = query.range(offset, offset + limit - 1);

      // Ordena por data de criação (mais recentes primeiro)
      query = query.order('created_at', { ascending: false });

      const { data, error, count } = await query;

      if (error) {
        this.logger.error('Erro ao listar certidões', { error: error.message });
        return failure(CertificateError.DATABASE_ERROR);
      }

      const entities = (data as CertificateRow[])
        .map((row) => this.mapToEntity(row))
        .filter((entity): entity is CertificateEntity => entity !== null);

      return success({
        data: entities,
        total: count ?? 0,
        limit,
        offset,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      this.logger.error('Erro crítico ao listar certidões', { error: errorMessage });
      return failure(CertificateError.DATABASE_ERROR);
    }
  }

  /**
   * Atualiza uma certidão
   */
  async update(id: string, data: UpdateCertificateData): Promise<Result<CertificateEntity>> {
    try {
      // Monta objeto de atualização com nomes de colunas do banco
      const updateData: Record<string, unknown> = {};

      if (data.certificateType !== undefined) {
        updateData['certificate_type'] = data.certificateType;
      }
      if (data.recordNumber !== undefined) {
        updateData['record_number'] = data.recordNumber;
      }
      if (data.partiesName !== undefined) {
        updateData['parties_name'] = data.partiesName;
      }
      if (data.notes !== undefined) {
        updateData['notes'] = data.notes;
      }
      if (data.priority !== undefined) {
        updateData['priority'] = data.priority;
      }
      if (data.status !== undefined) {
        updateData['status'] = data.status;
      }
      if (data.cost !== undefined) {
        updateData['cost'] = data.cost;
      }
      if (data.additionalCost !== undefined) {
        updateData['additional_cost'] = data.additionalCost;
      }
      if (data.orderNumber !== undefined) {
        updateData['order_number'] = data.orderNumber;
      }
      if (data.paymentDate !== undefined) {
        updateData['payment_date'] = data.paymentDate.toISOString().split('T')[0];
      }

      const { data: updatedData, error } = await this.supabaseClient
        .from('certificates')
        .update(updateData)
        .eq('id', id)
        .select()
        .single<CertificateRow>();

      if (error || !updatedData) {
        if (error?.code === 'PGRST116') {
          return failure(CertificateError.CERTIFICATE_NOT_FOUND);
        }
        this.logger.error('Erro ao atualizar certidão', { error: error?.message, id });
        return failure(CertificateError.DATABASE_ERROR);
      }

      const entity = this.mapToEntity(updatedData);
      if (!entity) {
        return failure(CertificateError.UNEXPECTED_ERROR);
      }

      return success(entity);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      this.logger.error('Erro crítico ao atualizar certidão', { error: errorMessage, id });
      return failure(CertificateError.DATABASE_ERROR);
    }
  }

  /**
   * Remove uma certidão
   */
  async delete(id: string): Promise<Result<void>> {
    try {
      const { error } = await this.supabaseClient.from('certificates').delete().eq('id', id);

      if (error) {
        this.logger.error('Erro ao deletar certidão', { error: error.message, id });
        return failure(CertificateError.DATABASE_ERROR);
      }

      return success(undefined);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      this.logger.error('Erro crítico ao deletar certidão', { error: errorMessage, id });
      return failure(CertificateError.DATABASE_ERROR);
    }
  }

  /**
   * Mapeia row do banco para entidade de domínio
   */
  private mapToEntity(row: CertificateRow): CertificateEntity | null {
    try {
      const statusResult = CertificateStatusValueObject.create(row.status);
      if (!statusResult.success) {
        this.logger.error('Status inválido no banco', { status: row.status, id: row.id });
        return null;
      }

      const priorityResult = CertificatePriorityValueObject.create(row.priority);
      if (!priorityResult.success) {
        this.logger.error('Prioridade inválida no banco', { priority: row.priority, id: row.id });
        return null;
      }

      return CertificateEntity.create({
        id: row.id,
        userId: row.user_id,
        certificateType: row.certificate_type,
        recordNumber: row.record_number,
        partiesName: row.parties_name,
        notes: row.notes,
        priority: priorityResult.data,
        status: statusResult.data,
        cost: row.cost,
        additionalCost: row.additional_cost,
        orderNumber: row.order_number,
        paymentDate: row.payment_date ? new Date(row.payment_date) : null,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      this.logger.error('Erro ao mapear certidão para entidade', {
        error: errorMessage,
        id: row.id,
      });
      return null;
    }
  }
}
