import { Type } from 'class-transformer';
import {
  IsHexColor,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class ListTagsQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

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

export class CreateTagDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  @IsHexColor()
  color?: string;
}

export class UpdateTagDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  @IsHexColor()
  color?: string;
}
