/**
 * Interface para criação de CertificateCommentEntity
 */
export interface CertificateCommentEntityProps {
  id: string;
  certificateId: string;
  userId: string;
  userRole: 'client' | 'admin';
  userName: string;
  content: string;
  createdAt: Date;
}

/**
 * Entidade que representa um comentário de certidão
 * Comentários são imutáveis após criação
 */
export class CertificateCommentEntity {
  readonly id: string;
  readonly certificateId: string;
  readonly userId: string;
  readonly userRole: 'client' | 'admin';
  readonly userName: string;
  readonly content: string;
  readonly createdAt: Date;

  private constructor(props: CertificateCommentEntityProps) {
    this.id = props.id;
    this.certificateId = props.certificateId;
    this.userId = props.userId;
    this.userRole = props.userRole;
    this.userName = props.userName;
    this.content = props.content;
    this.createdAt = props.createdAt;
  }

  static create(props: CertificateCommentEntityProps): CertificateCommentEntity {
    return new CertificateCommentEntity(props);
  }

  toDTO() {
    return {
      id: this.id,
      certificateId: this.certificateId,
      userId: this.userId,
      userRole: this.userRole,
      userName: this.userName,
      content: this.content,
      createdAt: this.createdAt.toISOString(),
    };
  }
}
