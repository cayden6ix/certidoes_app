# Dockerfile para desenvolvimento do frontend React
FROM node:20-alpine

WORKDIR /app

# Copia arquivos de dependências
COPY package*.json ./
COPY apps/frontend/package*.json ./apps/frontend/
COPY packages/shared/package*.json ./packages/shared/

# Instala dependências
RUN npm install

# Copia o código fonte
COPY apps/frontend ./apps/frontend
COPY packages/shared ./packages/shared
COPY tsconfig.base.json ./

WORKDIR /app/apps/frontend

# Expõe a porta do Vite
EXPOSE 5173

# Comando para desenvolvimento com hot reload
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
