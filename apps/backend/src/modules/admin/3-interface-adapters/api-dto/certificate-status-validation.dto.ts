import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, IsUUID, MaxLength, Min } from 'class-validator';

export class ListCertificateStatusValidationQueryDto {
  @IsOptional()
  @IsUUID()
  statusId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageSize?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number;
}

export class CreateCertificateStatusValidationDto {
  @IsUUID()
  statusId!: string;

  @IsUUID()
  validationId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  requiredField?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  confirmationText?: string | null;
}

export class UpdateCertificateStatusValidationDto {
  @IsOptional()
  @IsUUID()
  statusId?: string;

  @IsOptional()
  @IsUUID()
  validationId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  requiredField?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  confirmationText?: string | null;
}
