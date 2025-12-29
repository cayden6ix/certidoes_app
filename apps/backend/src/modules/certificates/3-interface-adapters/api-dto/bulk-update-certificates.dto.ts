import { Type } from 'class-transformer';
import {
  IsArray,
  IsString,
  IsOptional,
  IsIn,
  MaxLength,
  IsInt,
  Min,
  IsDateString,
  IsBoolean,
  ArrayMinSize,
  ArrayMaxSize,
  ValidateNested,
  IsUUID,
} from 'class-validator';

/**
 * DTO para dados individuais de cada certidao na atualizacao em massa
 */
export class IndividualCertificateUpdateApiDto {
  @IsUUID('4', { message: 'ID da certidão deve ser um UUID válido' })
  certificateId!: string;

  @IsOptional()
  @IsString()
  status?: string;

  /** Custo em centavos (ex: R$ 10,50 = 1050) */
  @IsOptional()
  @IsInt({ message: 'Custo deve ser um número inteiro (em centavos)' })
  @Min(0, { message: 'Custo não pode ser negativo' })
  cost?: number;

  /** Custo adicional em centavos (ex: R$ 5,25 = 525) */
  @IsOptional()
  @IsInt({ message: 'Custo adicional deve ser um número inteiro (em centavos)' })
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

  @IsOptional()
  @IsIn(['normal', 'urgent'], { message: 'Prioridade deve ser "normal" ou "urgent"' })
  priority?: 'normal' | 'urgent';
}

/**
 * DTO para dados globais aplicados a todas as certidoes
 */
export class GlobalUpdateApiDto {
  @IsOptional()
  @IsString({ message: 'Observações deve ser uma string' })
  @MaxLength(1000, { message: 'Observações deve ter no máximo 1000 caracteres' })
  notes?: string;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true, message: 'IDs das tags devem ser UUIDs válidos' })
  tagIds?: string[];

  /** Comentario a ser adicionado em todas as certidoes */
  @IsOptional()
  @IsString({ message: 'Comentário deve ser uma string' })
  @MaxLength(2000, { message: 'Comentário deve ter no máximo 2000 caracteres' })
  comment?: string;
}

/**
 * DTO de API para atualizacao em massa de certidoes
 * Validado com class-validator
 * Apenas admins podem realizar atualizacoes em massa
 */
export class BulkUpdateCertificatesApiDto {
  @IsArray()
  @ArrayMinSize(1, { message: 'Pelo menos uma certidão deve ser selecionada' })
  @ArrayMaxSize(50, { message: 'Máximo de 50 certidões por operação' })
  @IsUUID('4', { each: true, message: 'IDs das certidões devem ser UUIDs válidos' })
  certificateIds!: string[];

  @IsOptional()
  @ValidateNested()
  @Type(() => GlobalUpdateApiDto)
  globalData?: GlobalUpdateApiDto;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => IndividualCertificateUpdateApiDto)
  individualUpdates?: IndividualCertificateUpdateApiDto[];

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  validationConfirmed?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  validationStatement?: string;
}
