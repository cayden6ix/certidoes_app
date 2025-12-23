import { IsOptional, IsIn, IsInt, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';

/**
 * DTO de query params para listagem de certidões
 * Validado com class-validator
 */
export class ListCertificatesQueryDto {
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
