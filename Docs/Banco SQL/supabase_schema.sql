-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.certificate_comments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  certificate_id uuid NOT NULL,
  user_id uuid NOT NULL,
  user_role character varying NOT NULL CHECK (user_role::text = ANY (ARRAY['admin'::character varying, 'client'::character varying]::text[])),
  user_name character varying NOT NULL,
  content text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT certificate_comments_pkey PRIMARY KEY (id),
  CONSTRAINT certificate_comments_certificate_id_fkey FOREIGN KEY (certificate_id) REFERENCES public.certificates(id),
  CONSTRAINT certificate_comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.certificate_events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  certificate_id uuid NOT NULL,
  actor_user_id uuid NOT NULL,
  actor_role text NOT NULL CHECK (actor_role = ANY (ARRAY['client'::text, 'admin'::text])),
  event_type text NOT NULL,
  changes jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT certificate_events_pkey PRIMARY KEY (id),
  CONSTRAINT certificate_events_certificate_id_fkey FOREIGN KEY (certificate_id) REFERENCES public.certificates(id),
  CONSTRAINT certificate_events_actor_user_id_fkey FOREIGN KEY (actor_user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.certificate_status (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name character varying NOT NULL UNIQUE,
  display_name character varying NOT NULL,
  description text,
  color character varying DEFAULT '#6b7280'::character varying,
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  can_edit_certificate boolean DEFAULT true,
  is_final boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  created_by uuid,
  CONSTRAINT certificate_status_pkey PRIMARY KEY (id),
  CONSTRAINT certificate_status_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id)
);
CREATE TABLE public.certificate_status_validations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  status_id uuid NOT NULL,
  validation_id uuid NOT NULL,
  required_field text,
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  confirmation_text text,
  CONSTRAINT certificate_status_validations_pkey PRIMARY KEY (id),
  CONSTRAINT certificate_status_validations_status_id_fkey FOREIGN KEY (status_id) REFERENCES public.certificate_status(id),
  CONSTRAINT certificate_status_validations_validation_id_fkey FOREIGN KEY (validation_id) REFERENCES public.validations(id)
);
CREATE TABLE public.certificate_tag_assignments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  certificate_id uuid NOT NULL,
  tag_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT certificate_tag_assignments_pkey PRIMARY KEY (id),
  CONSTRAINT certificate_tag_assignments_certificate_id_fkey FOREIGN KEY (certificate_id) REFERENCES public.certificates(id),
  CONSTRAINT certificate_tag_assignments_tag_id_fkey FOREIGN KEY (tag_id) REFERENCES public.certificate_tags(id)
);
CREATE TABLE public.certificate_tags (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name character varying NOT NULL UNIQUE,
  color character varying NOT NULL DEFAULT '#6B7280'::character varying,
  active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT certificate_tags_pkey PRIMARY KEY (id)
);
CREATE TABLE public.certificates (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  certificate_type_id uuid NOT NULL,
  payment_type_id uuid,
  record_number character varying NOT NULL,
  party_names ARRAY NOT NULL DEFAULT '{}'::text[],
  observations text,
  priority integer NOT NULL DEFAULT 0 CHECK (priority >= 0 AND priority <= 5),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  additional_cost bigint DEFAULT 0.00,
  cost bigint DEFAULT 0.00,
  order_number text,
  payment_date date,
  status_id uuid NOT NULL,
  CONSTRAINT certificates_pkey PRIMARY KEY (id),
  CONSTRAINT certificates_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT certificates_certificate_type_id_fkey FOREIGN KEY (certificate_type_id) REFERENCES public.certificates_type(id),
  CONSTRAINT certificates_payment_type_id_fkey FOREIGN KEY (payment_type_id) REFERENCES public.payment_type(id),
  CONSTRAINT certificates_status_id_fkey FOREIGN KEY (status_id) REFERENCES public.certificate_status(id)
);
CREATE TABLE public.certificates_type (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name character varying NOT NULL UNIQUE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT certificates_type_pkey PRIMARY KEY (id)
);
CREATE TABLE public.payment_type (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name character varying NOT NULL UNIQUE,
  active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT payment_type_pkey PRIMARY KEY (id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  full_name text NOT NULL,
  email text NOT NULL UNIQUE,
  role USER-DEFINED NOT NULL DEFAULT 'client'::user_role,
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.validations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT validations_pkey PRIMARY KEY (id)
);