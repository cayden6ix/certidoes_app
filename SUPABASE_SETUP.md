# Configuração do Supabase - Schema do Banco de Dados

Este documento explica como configurar o banco de dados no Supabase para o sistema de controle de certidões notariais.

## 📋 Estrutura do Banco de Dados

### Enums
- `user_role`: `client`, `admin`
- `certificate_priority`: `normal`, `urgent`
- `certificate_status`: `pending`, `in_progress`, `completed`, `canceled`

### Tabelas

#### `profiles`
Tabela espelho de `auth.users` com informações adicionais do usuário.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID (PK, FK) | Referência para auth.users.id |
| full_name | TEXT | Nome completo do usuário |
| email | TEXT (UNIQUE) | Email do usuário |
| role | user_role | Papel no sistema (client ou admin) |
| created_at | TIMESTAMP | Data de criação |
| updated_at | TIMESTAMP | Data da última atualização |

#### `certificates`
Representa as certidões solicitadas pelos clientes.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID (PK) | ID único da certidão |
| user_id | UUID (FK) | Referência para profiles.id |
| certificate_type | TEXT | Tipo de certidão |
| record_number | TEXT | Número da ficha/registro |
| parties_name | TEXT | Nome das partes envolvidas |
| notes | TEXT | Observações adicionais |
| priority | certificate_priority | Prioridade (normal ou urgent) |
| status | certificate_status | Status atual |
| cost | NUMERIC(10,2) | Custo base |
| additional_cost | NUMERIC(10,2) | Custo adicional |
| order_number | TEXT | Número do pedido |
| payment_date | DATE | Data do pagamento |
| created_at | TIMESTAMP | Data de criação |
| updated_at | TIMESTAMP | Data da última atualização |

## 🚀 Como Aplicar o Schema

### Opção 1: Via Supabase Dashboard (Cloud)

1. Acesse o dashboard do seu projeto no [Supabase](https://app.supabase.com)
2. Vá para a seção **SQL Editor**
3. Clique em **New Query**
4. Copie todo o conteúdo do arquivo `supabase_schema.sql`
5. Cole no editor SQL
6. Clique em **Run** para executar o script

### Opção 2: Via Supabase CLI (Recomendado)

```bash
# 1. Instale o Supabase CLI (se ainda não tiver)
npm install -g supabase

# 2. Faça login no Supabase
supabase login

# 3. Inicialize o Supabase no projeto (se ainda não foi feito)
supabase init

# 4. Link com seu projeto
supabase link --project-ref seu-project-ref

# 5. Crie uma nova migration com o schema
supabase db diff -f initial_schema

# 6. Ou aplique o script diretamente
supabase db push
```

### Opção 3: Via psql (Local)

```bash
# Se estiver usando Supabase local
psql postgresql://postgres:postgres@localhost:54322/postgres -f supabase_schema.sql
```

## 🔐 Row Level Security (RLS)

O script já configura automaticamente as políticas de segurança:

### Profiles
- ✅ Usuários podem ver e editar apenas seu próprio perfil
- ✅ Admins podem ver e editar todos os perfis

### Certificates
- ✅ Clientes podem criar certidões
- ✅ Clientes podem ver apenas suas próprias certidões
- ✅ Clientes podem atualizar apenas suas próprias certidões
- ✅ Admins podem ver, criar, editar e deletar todas as certidões

## 👤 Criar Primeiro Usuário Admin

Após criar um usuário via Supabase Auth, você pode promovê-lo a admin de duas formas:

### Forma 1: Usando a função helper

```sql
SELECT promote_user_to_admin('admin@example.com');
```

### Forma 2: Update direto

```sql
UPDATE profiles
SET role = 'admin'
WHERE email = 'admin@example.com';
```

## 🔧 Triggers Automáticos

O schema inclui triggers que:

1. **Criar Profile Automaticamente**: Quando um usuário é criado em `auth.users`, automaticamente cria um registro em `profiles` com role `client` por padrão

2. **Atualizar Timestamps**: Atualiza automaticamente o campo `updated_at` em `profiles` e `certificates` sempre que um registro é modificado

## 📊 Views Úteis

### certificates_with_user
View que junta certidões com informações do usuário solicitante.

```sql
SELECT * FROM certificates_with_user;
```

## ✅ Verificar Instalação

Execute os seguintes comandos para verificar se tudo foi criado corretamente:

```sql
-- Verificar enums
SELECT * FROM pg_enum WHERE enumtypid = 'user_role'::regtype;
SELECT * FROM pg_enum WHERE enumtypid = 'certificate_priority'::regtype;
SELECT * FROM pg_enum WHERE enumtypid = 'certificate_status'::regtype;

-- Verificar tabelas
\d profiles
\d certificates

-- Verificar políticas RLS
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE schemaname = 'public';
```

## 🔄 Migrations (Recomendado)

Para manter o versionamento do banco de dados, é recomendado usar migrations:

```bash
# Criar uma nova migration
supabase migration new initial_schema

# Copie o conteúdo de supabase_schema.sql para o arquivo de migration criado
# Arquivo estará em: supabase/migrations/XXXXXXXXXXXXXX_initial_schema.sql

# Aplicar migrations
supabase db push

# Verificar status
supabase db status
```

## 📝 Variáveis de Ambiente

Certifique-se de configurar as seguintes variáveis no seu `.env`:

```bash
# Supabase
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=sua-anon-key
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key  # APENAS NO BACKEND!
```

## 🚨 Segurança

- ⚠️ **NUNCA** exponha a `SERVICE_ROLE_KEY` no frontend
- ⚠️ O frontend deve usar apenas a `ANON_KEY`
- ⚠️ Todas as tabelas têm RLS ativado
- ⚠️ Validações de permissão são feitas automaticamente pelo Supabase

## 📚 Próximos Passos

Após aplicar o schema:

1. ✅ Criar primeiro usuário via Supabase Auth
2. ✅ Promover usuário a admin usando `promote_user_to_admin()`
3. ✅ Configurar backend NestJS com integração Supabase
4. ✅ Configurar frontend React com Supabase Auth
5. ✅ Testar fluxo completo de autenticação
6. ✅ Testar criação e listagem de certidões

## 🐛 Troubleshooting

### Erro: "relation already exists"
Se você já executou o script antes, pode precisar dropar as tabelas primeiro:

```sql
DROP TABLE IF EXISTS certificates CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS certificate_priority CASCADE;
DROP TYPE IF EXISTS certificate_status CASCADE;
```

### Erro: "permission denied"
Certifique-se de estar usando um usuário com permissões adequadas (geralmente o usuário `postgres`).

### RLS bloqueando acesso
Durante desenvolvimento, você pode temporariamente desabilitar RLS (NÃO RECOMENDADO EM PRODUÇÃO):

```sql
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE certificates DISABLE ROW LEVEL SECURITY;
```

## 📞 Suporte

Em caso de dúvidas:
- [Documentação Supabase](https://supabase.com/docs)
- [Documentação RLS](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Discord](https://discord.supabase.com)
