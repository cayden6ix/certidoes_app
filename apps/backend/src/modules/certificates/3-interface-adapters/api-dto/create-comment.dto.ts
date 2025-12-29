import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

/**
 * DTO de API para criação de comentário
 */
export class CreateCommentApiDto {
  @IsString({ message: 'Conteúdo deve ser uma string' })
  @IsNotEmpty({ message: 'Conteúdo do comentário é obrigatório' })
  @MaxLength(2000, { message: 'Comentário deve ter no máximo 2000 caracteres' })
  content!: string;
}
