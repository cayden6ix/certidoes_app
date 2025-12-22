# Sistema de Controle de Certidões Notariais

Sistema para gerenciamento de solicitações de certidões notariais, permitindo que clientes solicitem certidões e administradores gerenciem os pedidos.

## Stack Tecnológica

- **Backend**: NestJS + TypeScript
- **Frontend**: React + Vite + Tailwind CSS
- **Banco de Dados**: Supabase (PostgreSQL)
- **Autenticação**: Supabase Auth
- **Containerização**: Docker + Docker Compose

## Estrutura do Projeto

```
certidoes_app/
├── apps/
│   ├── backend/          # API NestJS
│   └── frontend/         # Aplicação React
├── packages/
│   └── shared/           # Tipos e utilitários compartilhados
├── infra/
│   └── docker/           # Configurações Docker adicionais
├── Docs/                 # Documentação do projeto
│   ├── Sprints/          # Planejamento das sprints
│   └── Banco SQL/        # Schema do banco de dados
├── docker-compose.yml    # Orquestração dos containers
└── .env.example          # Exemplo de variáveis de ambiente
```

## Pré-requisitos

- Node.js 20+
- Docker e Docker Compose
- Conta no Supabase (ou Supabase CLI para desenvolvimento local)

## Configuração do Ambiente

### 1. Clonar o repositório

```bash
git clone <url-do-repositorio>
cd certidoes_app
```

### 2. Configurar variáveis de ambiente

```bash
# Copiar arquivo de exemplo
cp .env.example .env

# Editar com suas credenciais do Supabase
nano .env
```

Preencha as variáveis:

```env
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=sua-chave-anonima
SUPABASE_SERVICE_ROLE_KEY=sua-chave-de-servico
```

### 3. Instalar dependências (opcional para desenvolvimento local)

```bash
npm install
```

## Executando o Projeto

### Com Docker (recomendado)

```bash
# Subir todos os serviços
docker compose up

# Ou em modo detached
docker compose up -d

# Ver logs
docker compose logs -f
```

### Sem Docker (desenvolvimento local)

```bash
# Terminal 1 - Backend
cd apps/backend
npm install
npm run start:dev

# Terminal 2 - Frontend
cd apps/frontend
npm install
npm run dev
```

## Acessando a Aplicação

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000/api
- **Health Check**: http://localhost:3000/api/health

## Scripts Disponíveis

### Raiz do projeto

```bash
npm run dev           # Inicia via Docker Compose
npm run lint          # Executa lint em todos os workspaces
npm run format        # Formata código com Prettier
npm run test          # Executa testes em todos os workspaces
```

### Backend

```bash
npm run start:dev     # Desenvolvimento com hot reload
npm run build         # Build de produção
npm run test          # Testes unitários
npm run test:cov      # Testes com cobertura
```

### Frontend

```bash
npm run dev           # Desenvolvimento com hot reload
npm run build         # Build de produção
npm run preview       # Preview do build
```

## Arquitetura

O projeto segue os princípios de **Clean Architecture**:

```
src/
├── modules/
│   └── [module]/
│       ├── 1-domain/           # Entidades, contratos, regras de negócio
│       ├── 2-application/      # Use cases, DTOs de aplicação
│       ├── 3-interface-adapters/  # Controllers, DTOs de API
│       └── 4-infrastructure/   # Implementações, repositórios
└── shared/                     # Código compartilhado entre módulos
```

## Documentação

- [Sprint 1: Setup/Infra](Docs/Sprints/Sprint1:%20Setup%20-%20Infra.md)
- [Sprint 2: Banco + Auth](Docs/Sprints/Sprint2:%20Banco%20de%20Dados%20+%20Auth%20+%20Papéis)
- [Sprint 3: Fluxo de Certidões](Docs/Sprints/Sprint3:%20Fluxo%20de%20Certidões)
- [Schema SQL](Docs/Banco%20SQL/supabase_schema.sql)

## Padrões de Código

Consulte o arquivo [CLAUDE.md](CLAUDE.md) para os padrões de desenvolvimento.

### Principais regras:

- TypeScript com tipagem forte (sem `any`)
- Código em inglês, comentários em português
- Logger injetado (sem `console.log`)
- Cobertura de testes mínima: 80%
- Clean Architecture com 4 camadas
