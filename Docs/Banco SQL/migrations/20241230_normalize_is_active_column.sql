-- Migration: Normalizar coluna is_active em todas as tabelas
-- Data: 2024-12-30
-- Descrição: Padroniza o nome da coluna de status ativo para 'is_active' em todas as tabelas

-- 1. certificates_type: Adicionar coluna is_active (não existe atualmente)
ALTER TABLE public.certificates_type
ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

-- 2. payment_type: Renomear coluna 'active' para 'is_active'
ALTER TABLE public.payment_type
RENAME COLUMN active TO is_active;

-- 3. certificate_tags: Renomear coluna 'active' para 'is_active'
ALTER TABLE public.certificate_tags
RENAME COLUMN active TO is_active;

-- Comentário: As seguintes tabelas já usam 'is_active':
-- - certificate_status (is_active)
-- - validations (is_active)
