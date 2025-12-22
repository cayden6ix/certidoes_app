/**
 * DTO para resposta de login via API
 */
export class LoginResponseDto {
  user!: {
    id: string;
    email: string;
    fullName: string;
    role: 'client' | 'admin';
  };

  session!: {
    accessToken: string;
    refreshToken: string;
    expiresAt: number;
  };
}
