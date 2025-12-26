# CodeForm - Padrões de Desenvolvimento

> Este arquivo configura o agente para seguir os padrões CodeForm em todos os projetos.

---

## 🚨 Regras Invioláveis

### Proibições Absolutas

- **PROIBIDO**: Uso de `any` em TypeScript
- **PROIBIDO**: Fallbacks, mocks ou gambiarras em código de produção
- **PROIBIDO**: `console.log`, `console.error`, `console.warn` ou `print()` direto
- **PROIBIDO**: Quebrar ou modificar a arquitetura existente do sistema
- **PROIBIDO**: Decorators de framework nas camadas domain e application
- **PROIBIDO**: Misturar idiomas no código (ver seção de idiomas)

### Obrigações

- **OBRIGATÓRIO**: TypeScript com tipagem forte (Python: type hints em tudo)
- **OBRIGATÓRIO**: Princípios SOLID, YAGNI, KISS em toda implementação
- **OBRIGATÓRIO**: Result Pattern (TypeScript) ou Exceptions customizadas (Python)
- **OBRIGATÓRIO**: Logger injetado via contrato, logs estruturados com contexto
- **OBRIGATÓRIO**: Testes com cobertura mínima de 80% (Python: 85%)
- **OBRIGATÓRIO**: Mascaramento de dados sensíveis em logs

---

## 🌍 Padronização de Idiomas

| Contexto                             | Idioma        |
| ------------------------------------ | ------------- |
| Código (variáveis, funções, classes) | **INGLÊS**    |
| Comentários e documentação           | **PORTUGUÊS** |
| Mensagens de log                     | **PORTUGUÊS** |
| Mensagens de validação/erro          | **PORTUGUÊS** |

---

## 🏗️ Clean Architecture - 4 Camadas

As dependências sempre fluem de **fora para dentro**. Camadas internas não conhecem as externas.

### 1-domain (Domínio) - Camada mais interna

**Responsabilidade**: Regras de negócio puras, entidades, value objects, contratos

**PODE**: Definir entidades, value objects, contratos/interfaces, eventos de domínio, serviços puros
**NÃO PODE**: Decorators de framework, imports externos, dependências de infraestrutura

**Nomenclatura TypeScript**:

```
entities/auth-user.entity.ts
value-objects/email.value-object.ts
contracts/session.repository.contract.ts
services/user-authentication.service.ts
events/user-authenticated.event.ts
```

**Nomenclatura Python**:

```
entities/auth_user_entity.py
value_objects/email_value_object.py
contracts/session_repository_contract.py
services/user_authentication_service.py
events/user_authenticated_event.py
```

### 2-application (Aplicação)

**Responsabilidade**: Casos de uso, orquestração da lógica de negócio

**PODE**: Implementar use cases, orquestrar serviços de domínio, definir DTOs de aplicação
**NÃO PODE**: Decorators de framework, acesso direto a banco, chamadas HTTP

**Nomenclatura TypeScript**:

```
use-cases/authenticate-user.usecase.ts
base/logged-usecase.base.ts
dto/authentication-request.dto.ts
```

**Nomenclatura Python**:

```
use_cases/authenticate_user_usecase.py
base/logged_usecase_base.py
dto/authentication_request_dto.py
```

### 3-interface-adapters (Interface)

**Responsabilidade**: Controllers/Routers, DTOs de API, Guards, Middlewares

**PODE**: Usar decorators de framework, implementar controllers REST, criar guards/middlewares
**NÃO PODE**: Implementar lógica de negócio, acessar banco diretamente

**Nomenclatura TypeScript**:

```
web-controllers/authentication.controller.ts
api-dto/login-request.dto.ts
guards/jwt-auth.guard.ts
```

**Nomenclatura Python**:

```
routers/authentication_router.py
schemas/login_request_schema.py
dependencies/auth_dependency.py
```

### 4-infrastructure (Infraestrutura) - Camada mais externa

**Responsabilidade**: Implementações técnicas, repositórios, serviços externos, DI

**PODE**: Implementar contratos do domínio, usar frameworks, acessar banco, fazer HTTP
**NÃO PODE**: Definir regras de negócio, usar decorators em repositórios (usar factories)

**Nomenclatura TypeScript**:

```
repository-adapters/auth-user-prisma.repository.ts
services/jwt-token.service.ts
di/auth.tokens.ts
di/auth.providers.ts
```

**Nomenclatura Python**:

```
repository_adapters/auth_user_sqlalchemy_repository.py
services/jwt_token_service.py
di/auth_container.py
di/auth_providers.py
```

---

## 📁 Estrutura de Pastas

### Backend TypeScript (NestJS)

```
src/modules/[module]/
├── __tests__/
├── [module].module.ts
├── 1-domain/
│   ├── entities/
│   ├── value-objects/
│   ├── services/
│   ├── contracts/
│   ├── events/
│   └── index.ts
├── 2-application/
│   ├── use-cases/
│   ├── base/
│   ├── dto/
│   └── index.ts
├── 3-interface-adapters/
│   ├── web-controllers/
│   ├── api-dto/
│   ├── guards/
│   ├── strategies/
│   ├── middleware/
│   └── index.ts
└── 4-infrastructure/
    ├── repository-adapters/
    ├── services/
    ├── di/
    └── index.ts
```

### Backend Python (FastAPI)

```
src/modules/[module]/
├── tests/
├── domain/
│   ├── entities/
│   ├── value_objects/
│   ├── services/
│   ├── contracts/
│   ├── events/
│   └── __init__.py
├── application/
│   ├── use_cases/
│   ├── base/
│   ├── dto/
│   └── __init__.py
├── interface_adapters/
│   ├── routers/
│   ├── schemas/
│   ├── dependencies/
│   ├── middleware/
│   └── __init__.py
└── infrastructure/
    ├── repository_adapters/
    ├── services/
    ├── di/
    └── __init__.py
```

### Frontend React (MVVM)

```
src/modules/[module]/
├── domain/
│   ├── entities/
│   └── contracts/
├── application/
│   └── usecases/
├── infrastructure/
│   └── api/
├── presentation/
│   ├── viewmodels/
│   └── views/
├── routes/
├── di/
└── index.ts
```

---

## ⚙️ Padrões por Stack

### TypeScript/NestJS

- **ORM**: Prisma
- **Banco**: PostgreSQL
- **Validação**: class-validator nos DTOs
- **Tratamento de erros**: Result Pattern obrigatório
- **Factory Functions**: Obrigatório para repositórios, serviços e use cases

### Python/FastAPI

- **ORM**: SQLAlchemy
- **Banco**: PostgreSQL
- **Validação**: Pydantic
- **DI**: Dependency Injector
- **Logging**: Structlog
- **Tratamento de erros**: Exceptions customizadas com hierarquia
- **Pre-commit**: black, ruff, mypy, pytest

### Frontend React

- **State**: ViewModels com hooks
- **DI**: Container por módulo
- **Rotas**: Por módulo, compostas no router raiz

---

## 🧪 Testes

### Estrutura

```
__tests__/  (ou tests/ para Python)
├── unit/
│   ├── domain/
│   ├── application/
│   └── infrastructure/
├── integration/
│   ├── api/
│   └── repositories/
└── e2e/
```

### Requisitos

- Cobertura mínima: 80% (TypeScript) / 85% (Python)
- Testes de integração para fluxos principais
- Mocks organizados e reutilizáveis

### Cenários obrigatórios para endpoints REST

- Casos de sucesso (200, 201)
- Casos de erro esperado (400, 404, 403)
- Casos de validação (422, campos obrigatórios)
- Casos de autorização e autenticação

---

## 📝 Logging

### Contrato no Domínio

O LoggerContract deve ser definido na camada domain e implementado na infrastructure.

### Níveis e Uso

- **info**: Operações bem-sucedidas, eventos de negócio
- **warn**: Situações recuperáveis, degradação
- **error**: Falhas que precisam de atenção
- **debug**: Informações para desenvolvimento

### Dados Sensíveis - SEMPRE MASCARAR

- Senhas (mascarar completamente)
- Tokens (mostrar apenas primeiros/últimos caracteres)
- Dados pessoais (CPF, email parcialmente)
- Chaves de API (mascarar completamente)

---

## 🔧 Comandos Úteis

### TypeScript/NestJS

```bash
# Lint e verificação de any
npm run lint --silent

# Testes
npm run test
npm run test:cov

# Migrations
npm run migration:run

# Build
docker-compose build
```

### Python/FastAPI

```bash
# Formatação e lint
black .
ruff check .
mypy .

# Testes
pytest
pytest --cov=src --cov-report=term-missing

# Migrations
alembic upgrade head
```

---

## ✅ Checklist Pré-Commit

### Arquitetura

- [ ] Dependências fluem de fora para dentro
- [ ] Nenhum decorator de framework no domain/application
- [ ] Controllers/Routers separados por responsabilidade
- [ ] Use Cases orquestram, não implementam regras

### Código

- [ ] Sem uso de `any` (TypeScript)
- [ ] Type hints em tudo (Python)
- [ ] Código 100% em inglês
- [ ] Comentários 100% em português
- [ ] Logs e validações em português

### Qualidade

- [ ] Entidades imutáveis
- [ ] Factory functions para dependências puras
- [ ] Result Pattern / Exceptions customizadas
- [ ] Logger injetado, sem console/print direto
- [ ] Dados sensíveis mascarados

### Testes

- [ ] Cobertura atingida (80%/85%)
- [ ] Testes de integração para fluxos críticos

---

## 🔄 Progresso da Refatoração (Dezembro 2024)

### Objetivo

Tornar a codebase 100% Clean Architecture, seguindo SOLID, removendo fallbacks/mocks/hardcoded.

### Etapa Atual: Refatoração Backend (Clean Architecture)

#### ✅ Concluído

**Limpeza Inicial:**

- [x] Removidas credenciais de teste hardcoded do Login.tsx
- [x] Corrigido catch silencioso no AuthContext.tsx
- [x] Externalizado URLs hardcoded no vite.config.ts (usa env vars)
- [x] Extraídas cores para constantes (`CERTIFICATE_STATUS_COLORS`)
- [x] Centralizada configuração de locale (`date-format.ts`)
- [x] Extraído priority mapping para constantes com type guard

**Refatoração AdminUsers (Clean Architecture Completa):**

- [x] Criado contrato `AdminUserRepositoryContract` em 1-domain
- [x] Criado repositório `SupabaseAdminUserRepository` em 4-infrastructure
- [x] Criados use cases separados (List, Create, Update, Remove)
- [x] Configurado DI com tokens e providers
- [x] Atualizado controller para usar use cases via injeção
- [x] Removido fallback/retry logic do service antigo
- [x] Service antigo (`AdminUsersService`) pode ser deletado

**Refatoração ValidationsService (Clean Architecture Completa):**

- [x] Criado contrato `ValidationRepositoryContract` em 1-domain
- [x] Criado repositório `SupabaseValidationRepository` em 4-infrastructure
- [x] Criados use cases separados (List, Create, Update, Remove)
- [x] Configurado DI com tokens e providers
- [x] Atualizado controller para usar use cases via injeção
- [x] Service antigo (`ValidationsService`) pode ser deletado

**Refatoração PaymentTypesService (Clean Architecture Completa):**

- [x] Criado contrato `PaymentTypeRepositoryContract` em 1-domain
- [x] Criado repositório `SupabasePaymentTypeRepository` em 4-infrastructure
- [x] Criados use cases separados (List, Create, Update, Remove)
- [x] Configurado DI com tokens e providers
- [x] Atualizado controller para usar use cases via injeção
- [x] Removido fallback/retry logic (enabled/active workarounds)
- [x] Service antigo (`PaymentTypesService`) pode ser deletado

**Refatoração CertificateTypesService (Clean Architecture Completa):**

- [x] Criado contrato `CertificateTypeRepositoryContract` em 1-domain
- [x] Criado repositório `SupabaseCertificateTypeRepository` em 4-infrastructure
- [x] Criados use cases separados (List, Create, Update, Remove)
- [x] Configurado DI com tokens e providers
- [x] Atualizado controller para usar use cases via injeção
- [x] Service antigo (`CertificateTypesService`) pode ser deletado

**Refatoração CertificateStatusService (Clean Architecture Completa):**

- [x] Criado contrato `CertificateStatusRepositoryContract` em 1-domain (com métodos extras: findById, findByName, countCertificatesUsingStatus)
- [x] Criado repositório `SupabaseCertificateStatusRepository` em 4-infrastructure
- [x] Criados use cases separados (List, FindById, FindByName, Create, Update, Remove)
- [x] Configurado DI com tokens e providers
- [x] Atualizado controller para usar use cases via injeção
- [x] Service antigo (`CertificateStatusService`) pode ser deletado

**Refatoração CertificateStatusValidationsService (Clean Architecture Completa):**

- [x] Criado contrato `CertificateStatusValidationRepositoryContract` em 1-domain (relacionamento many-to-many)
- [x] Criado repositório `SupabaseCertificateStatusValidationRepository` em 4-infrastructure (com JOINs)
- [x] Criados use cases separados (List, Create, Update, Remove)
- [x] Configurado DI com tokens e providers
- [x] Atualizado controller para usar use cases via injeção
- [x] Service antigo (`CertificateStatusValidationsService`) pode ser deletado

**Refatoração CertificateTagsService (Clean Architecture Completa):**

- [x] Criado contrato `CertificateTagRepositoryContract` em 1-domain (com operações de assignment)
- [x] Criado repositório `SupabaseCertificateTagRepository` em 4-infrastructure
- [x] Criado repositório `SupabaseCertificateEventRepository` em 4-infrastructure (para auditoria)
- [x] Criados use cases separados (List, Create, Update, Remove, Assign, Unassign, UpdateCertificateTags)
- [x] Configurado DI com tokens e providers
- [x] Atualizado controller para usar use cases via injeção
- [x] Service antigo (`CertificateTagsService`) pode ser deletado

#### 🔲 Pendente (Backend)

**Refatorar UpdateCertificateUseCase:**

- [ ] Extrair CertificateAccessControlService
- [ ] Extrair CertificateStatusValidationService
- [ ] Extrair CertificateChangeTrackingService
- [ ] Reduzir método execute() de 220 para ~30 linhas

**Outros:**

- [ ] Criar constantes para magic values e pagination limits
- [ ] Implementar error type mapping strategy (OCP)

#### 🔲 Pendente (Frontend)

- [ ] Dividir AdminDashboard.tsx (2000+ linhas) em componentes menores
- [ ] Criar useConfirmDialog hook (substituir window.confirm)
- [ ] Extrair lógica duplicada em custom hooks reutilizáveis

### Estrutura de Arquivos Criados

```
apps/backend/src/modules/admin/
├── 1-domain/
│   ├── contracts/
│   │   ├── admin-user.repository.contract.ts
│   │   ├── validation.repository.contract.ts
│   │   ├── payment-type.repository.contract.ts
│   │   ├── certificate-type.repository.contract.ts
│   │   ├── certificate-status.repository.contract.ts
│   │   ├── certificate-status-validation.repository.contract.ts
│   │   ├── certificate-tag.repository.contract.ts
│   │   └── index.ts
│   └── index.ts
├── 2-application/
│   ├── use-cases/
│   │   ├── list-admin-users.usecase.ts
│   │   ├── create-admin-user.usecase.ts
│   │   ├── update-admin-user.usecase.ts
│   │   ├── remove-admin-user.usecase.ts
│   │   ├── validations/
│   │   │   ├── list-validations.usecase.ts
│   │   │   ├── create-validation.usecase.ts
│   │   │   ├── update-validation.usecase.ts
│   │   │   ├── remove-validation.usecase.ts
│   │   │   └── index.ts
│   │   ├── payment-types/
│   │   │   ├── list-payment-types.usecase.ts
│   │   │   ├── create-payment-type.usecase.ts
│   │   │   ├── update-payment-type.usecase.ts
│   │   │   ├── remove-payment-type.usecase.ts
│   │   │   └── index.ts
│   │   ├── certificate-types/
│   │   │   ├── list-certificate-types.usecase.ts
│   │   │   ├── create-certificate-type.usecase.ts
│   │   │   ├── update-certificate-type.usecase.ts
│   │   │   ├── remove-certificate-type.usecase.ts
│   │   │   └── index.ts
│   │   ├── certificate-status/
│   │   │   ├── list-certificate-status.usecase.ts
│   │   │   ├── find-certificate-status-by-id.usecase.ts
│   │   │   ├── find-certificate-status-by-name.usecase.ts
│   │   │   ├── create-certificate-status.usecase.ts
│   │   │   ├── update-certificate-status.usecase.ts
│   │   │   ├── remove-certificate-status.usecase.ts
│   │   │   └── index.ts
│   │   ├── certificate-status-validations/
│   │   │   ├── list-status-validations.usecase.ts
│   │   │   ├── create-status-validation.usecase.ts
│   │   │   ├── update-status-validation.usecase.ts
│   │   │   ├── remove-status-validation.usecase.ts
│   │   │   └── index.ts
│   │   ├── certificate-tags/
│   │   │   ├── list-tags.usecase.ts
│   │   │   ├── create-tag.usecase.ts
│   │   │   ├── update-tag.usecase.ts
│   │   │   ├── remove-tag.usecase.ts
│   │   │   ├── assign-tag.usecase.ts
│   │   │   ├── unassign-tag.usecase.ts
│   │   │   ├── update-certificate-tags.usecase.ts
│   │   │   └── index.ts
│   │   └── index.ts
│   └── index.ts
└── 4-infrastructure/
    ├── di/
    │   ├── admin.tokens.ts
    │   ├── admin.providers.ts
    │   └── index.ts
    ├── repository-adapters/
    │   ├── supabase-admin-user.repository.ts
    │   ├── supabase-validation.repository.ts
    │   ├── supabase-payment-type.repository.ts
    │   ├── supabase-certificate-type.repository.ts
    │   ├── supabase-certificate-status.repository.ts
    │   ├── supabase-certificate-status-validation.repository.ts
    │   ├── supabase-certificate-tag.repository.ts
    │   ├── supabase-certificate-event.repository.ts
    │   └── index.ts
    └── index.ts
```
