# Dockerfile para desenvolvimento do backend NestJS
FROM node:20-alpine

WORKDIR /app

# Copia arquivos de dependências
COPY package*.json ./
COPY apps/backend/package*.json ./apps/backend/
COPY packages/shared/package*.json ./packages/shared/

# Instala dependências
RUN npm install

# Copia o código fonte
COPY apps/backend ./apps/backend
COPY packages/shared ./packages/shared
COPY tsconfig.base.json ./

WORKDIR /app/apps/backend

# Expõe a porta do backend
EXPOSE 3000

# Comando para desenvolvimento com hot reload
CMD ["npm", "run", "start:dev"]
