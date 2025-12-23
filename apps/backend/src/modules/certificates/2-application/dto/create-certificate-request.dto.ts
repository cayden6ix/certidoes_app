/**
 * DTO para requisição de criação de certidão
 * Usado internamente entre controller e use case
 */
export class CreateCertificateRequestDto {
  constructor(
    public readonly userId: string,
    public readonly certificateType: string,
    public readonly recordNumber: string,
    public readonly partiesName: string,
    public readonly notes: string | null = null,
    public readonly priority: 'normal' | 'urgent' = 'normal',
  ) {}
}
