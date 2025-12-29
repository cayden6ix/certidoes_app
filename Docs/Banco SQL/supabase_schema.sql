-- =====================================================
-- SCHEMA SQL PARA SUPABASE
-- Sistema de Controle de Certidões Notariais
-- =====================================================
-- Baseado nas Sprints 1 e 2
-- Criado em: 2025-12-21
-- =====================================================

-- =====================================================
-- 1. CRIAÇÃO DOS ENUMS
-- =====================================================

-- Enum para papéis de usuário
CREATE TYPE user_role AS ENUM ('client', 'admin');

-- Enum para prioridade de certidão
CREATE TYPE certificate_priority AS ENUM ('normal', 'urgent');

-- Enum para status de certidão
CREATE TYPE certificate_status AS ENUM ('pending', 'in_progress', 'completed', 'canceled');

-- =====================================================
-- 2. FUNÇÃO AUXILIAR PARA ATUALIZAÇÃO DE TIMESTAMPS
-- =====================================================

-- Função que atualiza automaticamente o campo updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 3. TABELA PROFILES
-- =====================================================
-- Tabela espelho do auth.users
-- Armazena informações adicionais do perfil do usuário

CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    role user_role NOT NULL DEFAULT 'client',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Índices para melhorar performance
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_role ON profiles(role);

-- Comentários nas colunas
COMMENT ON TABLE profiles IS 'Perfis de usuários - espelho de auth.users com informações adicionais';
COMMENT ON COLUMN profiles.id IS 'ID do usuário (referencia auth.users.id)';
COMMENT ON COLUMN profiles.full_name IS 'Nome completo do usuário';
COMMENT ON COLUMN profiles.email IS 'Email do usuário (copiado de auth.users)';
COMMENT ON COLUMN profiles.role IS 'Papel do usuário no sistema (client ou admin)';

-- =====================================================
-- 4. TABELA CERTIFICATES
-- =====================================================
-- Representa as certidões solicitadas pelos clientes

CREATE TABLE certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    certificate_type TEXT NOT NULL,
    record_number TEXT,
    parties_name TEXT NOT NULL,
    notes TEXT,
    priority certificate_priority NOT NULL DEFAULT 'normal',
    status certificate_status NOT NULL DEFAULT 'pending',
    cost NUMERIC(10, 2) DEFAULT 0.00,
    additional_cost NUMERIC(10, 2) DEFAULT 0.00,
    order_number TEXT,
    payment_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Índices para melhorar performance
CREATE INDEX idx_certificates_user_id ON certificates(user_id);
CREATE INDEX idx_certificates_status ON certificates(status);
CREATE INDEX idx_certificates_priority ON certificates(priority);
CREATE INDEX idx_certificates_created_at ON certificates(created_at DESC);
CREATE INDEX idx_certificates_payment_date ON certificates(payment_date);

-- Comentários nas colunas
COMMENT ON TABLE certificates IS 'Certidões solicitadas pelos clientes';
COMMENT ON COLUMN certificates.id IS 'ID único da certidão';
COMMENT ON COLUMN certificates.user_id IS 'ID do usuário que solicitou a certidão';
COMMENT ON COLUMN certificates.certificate_type IS 'Tipo de certidão solicitada';
COMMENT ON COLUMN certificates.record_number IS 'Número da ficha/registro';
COMMENT ON COLUMN certificates.parties_name IS 'Nome das partes envolvidas';
COMMENT ON COLUMN certificates.notes IS 'Observações adicionais';
COMMENT ON COLUMN certificates.priority IS 'Prioridade da solicitação (normal ou urgente)';
COMMENT ON COLUMN certificates.status IS 'Status atual da certidão';
COMMENT ON COLUMN certificates.cost IS 'Custo base da certidão';
COMMENT ON COLUMN certificates.additional_cost IS 'Custo adicional (urgência, etc)';
COMMENT ON COLUMN certificates.order_number IS 'Número do pedido';
COMMENT ON COLUMN certificates.payment_date IS 'Data do pagamento';

-- =====================================================
-- 5. TRIGGERS PARA UPDATED_AT
-- =====================================================

-- Trigger para atualizar updated_at em profiles
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger para atualizar updated_at em certificates
CREATE TRIGGER update_certificates_updated_at
    BEFORE UPDATE ON certificates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 6. FUNÇÃO E TRIGGER PARA CRIAÇÃO AUTOMÁTICA DE PROFILE
-- =====================================================
-- Cria automaticamente um registro em profiles quando um usuário
-- é criado em auth.users

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, email, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        NEW.email,
        COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'client')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger que executa a função quando um novo usuário é criado
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- =====================================================
-- 7. ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Ativar RLS nas tabelas
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 7.1 POLÍTICAS RLS PARA PROFILES
-- =====================================================

-- Usuários podem ver seu próprio perfil
CREATE POLICY "Usuários podem ver seu próprio perfil"
    ON profiles
    FOR SELECT
    USING (auth.uid() = id);

-- Usuários podem atualizar seu próprio perfil (exceto role)
CREATE POLICY "Usuários podem atualizar seu próprio perfil"
    ON profiles
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Admins podem ver todos os perfis
CREATE POLICY "Admins podem ver todos os perfis"
    ON profiles
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Admins podem atualizar todos os perfis
CREATE POLICY "Admins podem atualizar todos os perfis"
    ON profiles
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- =====================================================
-- 7.2 POLÍTICAS RLS PARA CERTIFICATES
-- =====================================================

-- Clientes podem criar certidões
CREATE POLICY "Clientes podem criar certidões"
    ON certificates
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Clientes podem ver apenas suas próprias certidões
CREATE POLICY "Clientes podem ver suas próprias certidões"
    ON certificates
    FOR SELECT
    USING (auth.uid() = user_id);

-- Clientes podem atualizar apenas suas próprias certidões (campos limitados)
CREATE POLICY "Clientes podem atualizar suas próprias certidões"
    ON certificates
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Admins podem ver todas as certidões
CREATE POLICY "Admins podem ver todas as certidões"
    ON certificates
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- =====================================================
-- 8. TABELA VALIDATIONS E VÍNCULO COM STATUS
-- =====================================================

CREATE TABLE validations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE UNIQUE INDEX idx_validations_name ON validations(name);

CREATE TABLE certificate_status_validations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    status_id UUID NOT NULL REFERENCES certificate_status(id) ON DELETE CASCADE,
    validation_id UUID NOT NULL REFERENCES validations(id) ON DELETE CASCADE,
    required_field TEXT,
    confirmation_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE UNIQUE INDEX idx_status_validations_unique
  ON certificate_status_validations(status_id, validation_id, required_field);

CREATE TRIGGER update_validations_updated_at
    BEFORE UPDATE ON validations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_certificate_status_validations_updated_at
    BEFORE UPDATE ON certificate_status_validations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Admins podem criar certidões
CREATE POLICY "Admins podem criar certidões"
    ON certificates
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Admins podem atualizar todas as certidões
CREATE POLICY "Admins podem atualizar todas as certidões"
    ON certificates
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Admins podem deletar certidões
CREATE POLICY "Admins podem deletar certidões"
    ON certificates
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- =====================================================
-- 8. FUNÇÃO HELPER PARA CRIAR ADMIN
-- =====================================================
-- Use esta função para promover um usuário a admin
-- Exemplo de uso:
-- SELECT promote_user_to_admin('email@example.com');

CREATE OR REPLACE FUNCTION promote_user_to_admin(user_email TEXT)
RETURNS VOID AS $$
BEGIN
    UPDATE profiles
    SET role = 'admin'
    WHERE email = user_email;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Usuário com email % não encontrado', user_email;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 9. VIEWS ÚTEIS (OPCIONAL)
-- =====================================================

-- View para certificados com informações do usuário
CREATE OR REPLACE VIEW certificates_with_user AS
SELECT
    c.*,
    p.full_name as user_full_name,
    p.email as user_email,
    p.role as user_role
FROM certificates c
INNER JOIN profiles p ON c.user_id = p.id;

-- Comentário na view
COMMENT ON VIEW certificates_with_user IS 'Certidões com informações do usuário solicitante';

-- =====================================================
-- 10. SEED DATA (OPCIONAL - APENAS PARA DEV)
-- =====================================================
-- Descomente as linhas abaixo se quiser criar dados de teste

-- Exemplo de como criar um usuário admin manualmente após signup:
-- UPDATE profiles SET role = 'admin' WHERE email = 'admin@example.com';

-- =====================================================
-- 11. TABELA CERTIFICATE_COMMENTS
-- =====================================================
-- Armazena comentários de certidões
-- Tanto admins quanto clientes podem comentar

CREATE TABLE certificate_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    certificate_id UUID NOT NULL REFERENCES certificates(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    user_role VARCHAR(20) NOT NULL CHECK (user_role IN ('admin', 'client')),
    user_name VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Índices para melhorar performance
CREATE INDEX idx_certificate_comments_certificate_id ON certificate_comments(certificate_id);
CREATE INDEX idx_certificate_comments_created_at ON certificate_comments(created_at);

-- Comentários nas colunas
COMMENT ON TABLE certificate_comments IS 'Comentários de certidões feitos por admins e clientes';
COMMENT ON COLUMN certificate_comments.id IS 'ID único do comentário';
COMMENT ON COLUMN certificate_comments.certificate_id IS 'ID da certidão associada';
COMMENT ON COLUMN certificate_comments.user_id IS 'ID do usuário que fez o comentário';
COMMENT ON COLUMN certificate_comments.user_role IS 'Papel do usuário (admin ou client)';
COMMENT ON COLUMN certificate_comments.user_name IS 'Nome do usuário no momento do comentário';
COMMENT ON COLUMN certificate_comments.content IS 'Conteúdo do comentário';
COMMENT ON COLUMN certificate_comments.created_at IS 'Data e hora de criação do comentário';

-- RLS para certificate_comments
ALTER TABLE certificate_comments ENABLE ROW LEVEL SECURITY;

-- Clientes podem criar comentários em suas próprias certidões
CREATE POLICY "Clientes podem criar comentários em suas certidões"
    ON certificate_comments
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM certificates
            WHERE certificates.id = certificate_id
            AND certificates.user_id = auth.uid()
        )
    );

-- Clientes podem ver comentários de suas próprias certidões
CREATE POLICY "Clientes podem ver comentários de suas certidões"
    ON certificate_comments
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM certificates
            WHERE certificates.id = certificate_id
            AND certificates.user_id = auth.uid()
        )
    );

-- Admins podem criar comentários em qualquer certidão
CREATE POLICY "Admins podem criar comentários"
    ON certificate_comments
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Admins podem ver todos os comentários
CREATE POLICY "Admins podem ver todos os comentários"
    ON certificate_comments
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Admins podem deletar qualquer comentário
CREATE POLICY "Admins podem deletar comentários"
    ON certificate_comments
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- =====================================================
-- FIM DO SCRIPT
-- =====================================================

-- Para verificar se tudo foi criado corretamente:
-- SELECT * FROM pg_enum WHERE enumtypid = 'user_role'::regtype;
-- SELECT * FROM pg_enum WHERE enumtypid = 'certificate_priority'::regtype;
-- SELECT * FROM pg_enum WHERE enumtypid = 'certificate_status'::regtype;
-- \d profiles
-- \d certificates
