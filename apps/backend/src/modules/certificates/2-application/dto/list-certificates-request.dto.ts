/**
 * DTO para requisição de listagem de certidões
 * Usado internamente entre controller e use case
 */
export class ListCertificatesRequestDto {
  constructor(
    public readonly userId: string,
    public readonly userRole: 'client' | 'admin',
    public readonly filters: {
      search?: string;
      from?: string;
      to?: string;
      status?: string;
      priority?: string;
      limit?: number;
      offset?: number;
    } = {},
  ) {}
}
