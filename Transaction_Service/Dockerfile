# Dockerfile
# Build from root context: docker build -f Transaction_Service/Dockerfile -t transaction-service:dev .

# ---------- Stage 1: Build ----------
FROM node:20-alpine AS builder
WORKDIR /app
RUN apk add --no-cache python3 make g++ libc6-compat
RUN corepack disable && npm i -g npm@latest

ENV NODE_ENV=development

# Build Transaction Service
WORKDIR /app/transaction-service
COPY Transaction_Service/package*.json ./
RUN npm ci --no-audit --no-fund --legacy-peer-deps

COPY Transaction_Service/tsconfig*.json ./
COPY Transaction_Service/nest-cli.json ./
COPY Transaction_Service/src ./src
RUN npm run build

# Tạo node_modules production
RUN npm prune --omit=dev --legacy-peer-deps

# ---------- Stage 2: Runtime ----------
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN set -eux; \
  for i in 1 2 3; do \
    apk update && apk add --no-cache libc6-compat && break || (echo "apk retry $i/3"; sleep 5); \
  done

COPY --from=builder /app/transaction-service/package*.json ./
COPY --from=builder /app/transaction-service/node_modules ./node_modules
COPY --from=builder /app/transaction-service/dist ./dist

EXPOSE 3009

CMD ["node", "dist/main"]
