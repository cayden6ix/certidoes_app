import type { UserRole } from './user.types';

export interface AdminUser {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  createdAt: string;
  updatedAt?: string;
}

export interface PaymentType {
  id: string;
  name: string;
  description: string | null;
  enabled: boolean;
  createdAt: string;
}

export interface CertificateCatalogType {
  id: string;
  name: string;
  description: string | null;
  isActive?: boolean | null;
  createdAt: string;
}

export interface CertificateTag {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  createdBy: string | null;
  createdAt: string;
}
