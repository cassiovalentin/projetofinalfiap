FROM node:20-alpine

WORKDIR /app

# Instala dependências primeiro (melhor cache)
COPY package*.json ./
RUN npm ci

# Copia o resto do projeto
COPY . .

# Compila Nest (gera dist/)
RUN npm run build

EXPOSE 3000

CMD ["node", "dist/main.js"]
