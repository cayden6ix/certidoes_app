import { IsOptional, IsIn, IsInt, Min, Max, IsString, IsDateString } from 'class-validator';
import { Transform } from 'class-transformer';

/**
 * DTO de query params para listagem de certidões
 * Validado com class-validator
 */
export class ListCertificatesQueryDto {
  @IsOptional()
  @IsString({ message: 'Busca deve ser uma string' })
  search?: string;

  @IsOptional()
  @IsDateString({}, { message: 'Data inicial deve ser uma data válida (ISO 8601)' })
  from?: string;

  @IsOptional()
  @IsDateString({}, { message: 'Data final deve ser uma data válida (ISO 8601)' })
  to?: string;

  @IsOptional()
  @IsIn(['pending', 'in_progress', 'completed', 'canceled'], {
    message: 'Status deve ser "pending", "in_progress", "completed" ou "canceled"',
  })
  status?: string;

  @IsOptional()
  @IsIn(['normal', 'urgent'], { message: 'Prioridade deve ser "normal" ou "urgent"' })
  priority?: string;

  @IsOptional()
  @Transform(({ value }) => (value ? parseInt(value, 10) : undefined))
  @IsInt({ message: 'Página deve ser um número inteiro' })
  @Min(1, { message: 'Página mínima é 1' })
  page?: number;

  @IsOptional()
  @Transform(({ value }) => (value ? parseInt(value, 10) : undefined))
  @IsInt({ message: 'PageSize deve ser um número inteiro' })
  @Min(1, { message: 'PageSize mínimo é 1' })
  @Max(100, { message: 'PageSize máximo é 100' })
  pageSize?: number;

  @IsOptional()
  @Transform(({ value }) => (value ? parseInt(value, 10) : undefined))
  @IsInt({ message: 'Limite deve ser um número inteiro' })
  @Min(1, { message: 'Limite mínimo é 1' })
  @Max(100, { message: 'Limite máximo é 100' })
  limit?: number;

  @IsOptional()
  @Transform(({ value }) => (value ? parseInt(value, 10) : undefined))
  @IsInt({ message: 'Offset deve ser um número inteiro' })
  @Min(0, { message: 'Offset mínimo é 0' })
  offset?: number;
}
