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
          status_id: string;
          /** Custo em centavos (ex: R$ 10,50 = 1050) */
          cost: number | null;
          /** Custo adicional em centavos (ex: R$ 5,25 = 525) */
          additional_cost: number | null;
          order_number: string | null;
          payment_type_id: string | null;
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
          status_id?: string;
          /** Custo em centavos (ex: R$ 10,50 = 1050) */
          cost?: number | null;
          /** Custo adicional em centavos (ex: R$ 5,25 = 525) */
          additional_cost?: number | null;
          order_number?: string | null;
          payment_type_id?: string | null;
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
          status_id?: string;
          /** Custo em centavos (ex: R$ 10,50 = 1050) */
          cost?: number | null;
          /** Custo adicional em centavos (ex: R$ 5,25 = 525) */
          additional_cost?: number | null;
          order_number?: string | null;
          payment_type_id?: string | null;
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
          {
            foreignKeyName: 'certificates_payment_type_id_fkey';
            columns: ['payment_type_id'];
            isOneToOne: false;
            referencedRelation: 'payment_type';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'certificates_status_id_fkey';
            columns: ['status_id'];
            isOneToOne: false;
            referencedRelation: 'certificate_status';
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
      certificates_type: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          created_at: string;
          is_active: boolean | null;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          created_at?: string;
          is_active?: boolean | null;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          created_at?: string;
          is_active?: boolean | null;
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
      payment_type: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          enabled: boolean | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          enabled?: boolean | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          enabled?: boolean | null;
          created_at?: string;
        };
        Relationships: [];
      };
      certificate_tags: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          color: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          color?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          color?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      certificate_tag_assignments: {
        Row: {
          id: string;
          certificate_id: string;
          tag_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          certificate_id: string;
          tag_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          certificate_id?: string;
          tag_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'certificate_tag_assignments_certificate_id_fkey';
            columns: ['certificate_id'];
            isOneToOne: false;
            referencedRelation: 'certificates';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'certificate_tag_assignments_tag_id_fkey';
            columns: ['tag_id'];
            isOneToOne: false;
            referencedRelation: 'certificate_tags';
            referencedColumns: ['id'];
          },
        ];
      };
      certificate_status: {
        Row: {
          id: string;
          name: string;
          display_name: string;
          description: string | null;
          color: string;
          display_order: number;
          is_active: boolean;
          can_edit_certificate: boolean;
          is_final: boolean;
          created_at: string;
          updated_at: string;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          display_name: string;
          description?: string | null;
          color?: string;
          display_order?: number;
          is_active?: boolean;
          can_edit_certificate?: boolean;
          is_final?: boolean;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          display_name?: string;
          description?: string | null;
          color?: string;
          display_order?: number;
          is_active?: boolean;
          can_edit_certificate?: boolean;
          is_final?: boolean;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'certificate_status_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      validations: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      certificate_status_validations: {
        Row: {
          id: string;
          status_id: string;
          validation_id: string;
          required_field: string | null;
          confirmation_text: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          status_id: string;
          validation_id: string;
          required_field?: string | null;
          confirmation_text?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          status_id?: string;
          validation_id?: string;
          required_field?: string | null;
          confirmation_text?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'certificate_status_validations_status_id_fkey';
            columns: ['status_id'];
            isOneToOne: false;
            referencedRelation: 'certificate_status';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'certificate_status_validations_validation_id_fkey';
            columns: ['validation_id'];
            isOneToOne: false;
            referencedRelation: 'validations';
            referencedColumns: ['id'];
          },
        ];
      };
      certificate_comments: {
        Row: {
          id: string;
          certificate_id: string;
          user_id: string;
          user_role: UserRole;
          user_name: string;
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          certificate_id: string;
          user_id: string;
          user_role: UserRole;
          user_name: string;
          content: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          certificate_id?: string;
          user_id?: string;
          user_role?: UserRole;
          user_name?: string;
          content?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'certificate_comments_certificate_id_fkey';
            columns: ['certificate_id'];
            isOneToOne: false;
            referencedRelation: 'certificates';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'certificate_comments_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      user_role: UserRole;
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
