/**
 * DTO de resposta para comentário
 */
export interface CommentResponseDto {
  id: string;
  certificateId: string;
  userId: string;
  userRole: 'client' | 'admin';
  userName: string;
  content: string;
  createdAt: string;
}
