/**
 * DTO para requisição de listagem de certidões
 * Usado internamente entre controller e use case
 */
export class ListCertificatesRequestDto {
  constructor(
    public readonly userId: string,
    public readonly userRole: string,
    public readonly filters: {
      status?: string;
      priority?: string;
      limit?: number;
      offset?: number;
    } = {},
  ) {}
}
