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

| Contexto | Idioma |
|----------|--------|
| Código (variáveis, funções, classes) | **INGLÊS** |
| Comentários e documentação | **PORTUGUÊS** |
| Mensagens de log | **PORTUGUÊS** |
| Mensagens de validação/erro | **PORTUGUÊS** |

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
