/**
 * Interface para criação de CertificateEventEntity
 */
export interface CertificateEventEntityProps {
  id: string;
  certificateId: string;
  actorUserId: string;
  actorRole: 'client' | 'admin';
  eventType: string;
  changes: Record<string, unknown> | null;
  createdAt: Date;
}

/**
 * Entidade que representa um evento de certidão
 */
export class CertificateEventEntity {
  readonly id: string;
  readonly certificateId: string;
  readonly actorUserId: string;
  readonly actorRole: 'client' | 'admin';
  readonly eventType: string;
  readonly changes: Record<string, unknown> | null;
  readonly createdAt: Date;

  private constructor(props: CertificateEventEntityProps) {
    this.id = props.id;
    this.certificateId = props.certificateId;
    this.actorUserId = props.actorUserId;
    this.actorRole = props.actorRole;
    this.eventType = props.eventType;
    this.changes = props.changes;
    this.createdAt = props.createdAt;
  }

  static create(props: CertificateEventEntityProps): CertificateEventEntity {
    return new CertificateEventEntity(props);
  }

  toDTO() {
    return {
      id: this.id,
      certificateId: this.certificateId,
      actorUserId: this.actorUserId,
      actorRole: this.actorRole,
      eventType: this.eventType,
      changes: this.changes,
      createdAt: this.createdAt.toISOString(),
    };
  }
}
