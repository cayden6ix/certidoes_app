/**
 * Tipos do schema do banco de dados Supabase
 * Seguindo as melhores práticas de tipagem do Supabase
 *
 * Este arquivo define o schema completo do banco para tipagem forte
 * em todas as operações com o Supabase Client
 */

/**
 * Tipos de role de usuário
 */
export type UserRole = 'client' | 'admin';

/**
 * Tipos de status de certidão
 */
export type CertificateStatus = 'pending' | 'in_progress' | 'completed' | 'canceled';

/**
 * Tipos de prioridade de certidão
 */
export type CertificatePriority = 1 | 2;

/**
 * Schema do banco de dados
 */
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          role: UserRole;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name: string;
          role?: UserRole;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string;
          role?: UserRole;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      certificates: {
        Row: {
          id: string;
          user_id: string;
          certificate_type_id: string | null;
          record_number: string;
          party_names: string[] | null;
          observations: string | null;
          priority: CertificatePriority | null;
          status: CertificateStatus;
          cost: number | null;
          additional_cost: number | null;
          order_number: string | null;
          payment_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          certificate_type_id?: string | null;
          record_number: string;
          party_names?: string[] | null;
          observations?: string | null;
          priority?: CertificatePriority | null;
          status?: CertificateStatus;
          cost?: number | null;
          additional_cost?: number | null;
          order_number?: string | null;
          payment_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          certificate_type_id?: string | null;
          record_number?: string;
          party_names?: string[] | null;
          observations?: string | null;
          priority?: CertificatePriority | null;
          status?: CertificateStatus;
          cost?: number | null;
          additional_cost?: number | null;
          order_number?: string | null;
          payment_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'certificates_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'certificates_certificate_type_id_fkey';
            columns: ['certificate_type_id'];
            isOneToOne: false;
            referencedRelation: 'certificate_types';
            referencedColumns: ['id'];
          },
        ];
      };
      certificate_types: {
        Row: {
          id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      certificate_events: {
        Row: {
          id: string;
          certificate_id: string;
          event_type: string;
          description: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          certificate_id: string;
          event_type: string;
          description?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          certificate_id?: string;
          event_type?: string;
          description?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'certificate_events_certificate_id_fkey';
            columns: ['certificate_id'];
            isOneToOne: false;
            referencedRelation: 'certificates';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      user_role: UserRole;
      certificate_status: CertificateStatus;
    };
    CompositeTypes: Record<string, never>;
  };
}

/**
 * Alias para tabelas do schema público
 */
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];

/**
 * Alias para insert de tabelas
 */
export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];

/**
 * Alias para update de tabelas
 */
export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];
