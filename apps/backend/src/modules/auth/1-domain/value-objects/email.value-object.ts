/**
 * Value Object para Email
 * Garante que o email seja válido
 */
export class EmailValueObject {
  private readonly value: string;

  constructor(email: string) {
    if (!this.isValid(email)) {
      throw new Error('Email inválido');
    }
    this.value = email.toLowerCase().trim();
  }

  getValue(): string {
    return this.value;
  }

  /**
   * Valida formato do email
   */
  private isValid(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Mascara o email para logs
   * Exemplo: john.doe@example.com -> j***e@e***e.com
   */
  mask(): string {
    const [localPart, domain] = this.value.split('@');
    const maskedLocal =
      localPart.charAt(0) +
      '***' +
      (localPart.length > 1 ? localPart.charAt(localPart.length - 1) : '');
    const [domainName, tld] = domain.split('.');
    const maskedDomain =
      domainName.charAt(0) + '***' + (domainName.length > 1 ? domainName.charAt(domainName.length - 1) : '');
    return `${maskedLocal}@${maskedDomain}.${tld}`;
  }

  equals(other: EmailValueObject): boolean {
    return this.value === other.value;
  }
}
