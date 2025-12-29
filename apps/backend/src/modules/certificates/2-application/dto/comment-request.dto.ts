/**
 * DTO para criação de comentário
 */
export class CreateCommentRequestDto {
  readonly certificateId: string;
  readonly userId: string;
  readonly userRole: 'client' | 'admin';
  readonly userName: string;
  readonly content: string;

  constructor(
    certificateId: string,
    userId: string,
    userRole: 'client' | 'admin',
    userName: string,
    content: string,
  ) {
    this.certificateId = certificateId;
    this.userId = userId;
    this.userRole = userRole;
    this.userName = userName;
    this.content = content;
  }
}

/**
 * DTO para listagem de comentários
 */
export class ListCommentsRequestDto {
  readonly certificateId: string;
  readonly userId: string;
  readonly userRole: 'client' | 'admin';

  constructor(certificateId: string, userId: string, userRole: 'client' | 'admin') {
    this.certificateId = certificateId;
    this.userId = userId;
    this.userRole = userRole;
  }
}

/**
 * DTO para deleção de comentário
 */
export class DeleteCommentRequestDto {
  readonly commentId: string;
  readonly certificateId: string;
  readonly userId: string;
  readonly userRole: 'client' | 'admin';

  constructor(
    commentId: string,
    certificateId: string,
    userId: string,
    userRole: 'client' | 'admin',
  ) {
    this.commentId = commentId;
    this.certificateId = certificateId;
    this.userId = userId;
    this.userRole = userRole;
  }
}
