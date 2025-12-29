import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

/**
 * DTO para query params do endpoint de relatórios
 * Suporta filtros padrão, filtros opcionais e paginação
 */
export class ReportQueryDto {
  // ====== Filtros Padrão ======

  @IsOptional()
  @IsUUID('4', { message: 'ID do tipo de certidão deve ser um UUID válido' })
  certificateTypeId?: string;

  @IsOptional()
  @IsString({ message: 'Número da ficha deve ser uma string' })
  recordNumber?: string;

  @IsOptional()
  @IsUUID('4', { message: 'ID do status deve ser um UUID válido' })
  statusId?: string;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) => {
    if (typeof value === 'string') {
      return value.split(',').filter(Boolean);
    }
    if (Array.isArray(value)) {
      return value.filter((item): item is string => typeof item === 'string' && item.length > 0);
    }
    return undefined;
  })
  @IsArray({ message: 'Tags devem ser um array' })
  @IsUUID('4', { each: true, message: 'Cada tag deve ser um UUID válido' })
  tagIds?: string[];

  @IsOptional()
  @IsUUID('4', { message: 'ID do tipo de pagamento deve ser um UUID válido' })
  paymentTypeId?: string;

  @IsOptional()
  @IsDateString({}, { message: 'Data de pagamento inicial deve ser uma data válida (ISO 8601)' })
  paymentDateFrom?: string;

  @IsOptional()
  @IsDateString({}, { message: 'Data de pagamento final deve ser uma data válida (ISO 8601)' })
  paymentDateTo?: string;

  // ====== Filtros Opcionais ======

  @IsOptional()
  @IsString({ message: 'Número do pedido deve ser uma string' })
  orderNumber?: string;

  @IsOptional()
  @IsUUID('4', { message: 'ID do usuário deve ser um UUID válido' })
  userId?: string;

  @IsOptional()
  @IsString({ message: 'Busca em comentários deve ser uma string' })
  commentSearch?: string;

  @IsOptional()
  @IsString({ message: 'Busca em observações deve ser uma string' })
  notesSearch?: string;

  @IsOptional()
  @IsString({ message: 'Busca em nome das partes deve ser uma string' })
  partiesNameSearch?: string;

  // ====== Paginação ======

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Página deve ser um número inteiro' })
  @Min(1, { message: 'Página mínima é 1' })
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'PageSize deve ser um número inteiro' })
  @Min(1, { message: 'PageSize mínimo é 1' })
  @Max(100, { message: 'PageSize máximo é 100' })
  pageSize?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Limite deve ser um número inteiro' })
  @Min(1, { message: 'Limite mínimo é 1' })
  limit?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Offset deve ser um número inteiro' })
  @Min(0, { message: 'Offset mínimo é 0' })
  offset?: number;
}
