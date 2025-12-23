/**
 * DTO para requisição de listagem de eventos de certidão
 */
export class ListCertificateEventsRequestDto {
  constructor(
    public readonly certificateId: string,
    public readonly userId: string,
    public readonly userRole: 'client' | 'admin',
  ) {}
}
