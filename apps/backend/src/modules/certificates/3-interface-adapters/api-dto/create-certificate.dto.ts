import { IsString, IsNotEmpty, IsOptional, IsIn, MaxLength } from 'class-validator';

/**
 * DTO de API para criação de certidão
 * Validado com class-validator
 */
export class CreateCertificateApiDto {
  @IsNotEmpty({ message: 'Tipo de certidão é obrigatório' })
  @IsString({ message: 'Tipo de certidão deve ser uma string' })
  @MaxLength(255, { message: 'Tipo de certidão deve ter no máximo 255 caracteres' })
  certificateType!: string;

  @IsNotEmpty({ message: 'Número da ficha é obrigatório' })
  @IsString({ message: 'Número da ficha deve ser uma string' })
  @MaxLength(50, { message: 'Número da ficha deve ter no máximo 50 caracteres' })
  recordNumber!: string;

  @IsNotEmpty({ message: 'Nome das partes é obrigatório' })
  @IsString({ message: 'Nome das partes deve ser uma string' })
  @MaxLength(500, { message: 'Nome das partes deve ter no máximo 500 caracteres' })
  partiesName!: string;

  @IsOptional()
  @IsString({ message: 'Observações deve ser uma string' })
  @MaxLength(1000, { message: 'Observações deve ter no máximo 1000 caracteres' })
  notes?: string;

  @IsOptional()
  @IsIn(['normal', 'urgent'], { message: 'Prioridade deve ser "normal" ou "urgent"' })
  priority?: 'normal' | 'urgent';
}
