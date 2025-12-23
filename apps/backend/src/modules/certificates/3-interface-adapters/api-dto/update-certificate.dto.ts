import {
  IsString,
  IsOptional,
  IsIn,
  MaxLength,
  IsNumber,
  Min,
  IsDateString,
} from 'class-validator';

/**
 * DTO de API para atualização de certidão pelo cliente
 * Validado com class-validator
 * Cliente só pode atualizar campos não-administrativos
 */
export class UpdateCertificateClientApiDto {
  @IsOptional()
  @IsString({ message: 'Tipo de certidão deve ser uma string' })
  @MaxLength(255, { message: 'Tipo de certidão deve ter no máximo 255 caracteres' })
  certificateType?: string;

  @IsOptional()
  @IsString({ message: 'Número da ficha deve ser uma string' })
  @MaxLength(50, { message: 'Número da ficha deve ter no máximo 50 caracteres' })
  recordNumber?: string;

  @IsOptional()
  @IsString({ message: 'Nome das partes deve ser uma string' })
  @MaxLength(500, { message: 'Nome das partes deve ter no máximo 500 caracteres' })
  partiesName?: string;

  @IsOptional()
  @IsString({ message: 'Observações deve ser uma string' })
  @MaxLength(1000, { message: 'Observações deve ter no máximo 1000 caracteres' })
  notes?: string;

  @IsOptional()
  @IsIn(['normal', 'urgent'], { message: 'Prioridade deve ser "normal" ou "urgent"' })
  priority?: 'normal' | 'urgent';
}

/**
 * DTO de API para atualização de certidão pelo admin
 * Validado com class-validator
 * Admin pode atualizar todos os campos
 */
export class UpdateCertificateAdminApiDto extends UpdateCertificateClientApiDto {
  @IsOptional()
  @IsIn(['pending', 'in_progress', 'completed', 'canceled'], {
    message: 'Status deve ser "pending", "in_progress", "completed" ou "canceled"',
  })
  status?: 'pending' | 'in_progress' | 'completed' | 'canceled';

  @IsOptional()
  @IsNumber({}, { message: 'Custo deve ser um número' })
  @Min(0, { message: 'Custo não pode ser negativo' })
  cost?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Custo adicional deve ser um número' })
  @Min(0, { message: 'Custo adicional não pode ser negativo' })
  additionalCost?: number;

  @IsOptional()
  @IsString({ message: 'Número do pedido deve ser uma string' })
  @MaxLength(50, { message: 'Número do pedido deve ter no máximo 50 caracteres' })
  orderNumber?: string;

  @IsOptional()
  @IsDateString({}, { message: 'Data de pagamento deve ser uma data válida (ISO 8601)' })
  paymentDate?: string;

  @IsOptional()
  @IsString({ message: 'Tipo de pagamento deve ser uma string' })
  paymentTypeId?: string | null;
}
