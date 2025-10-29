
# ---------- Stage 1: Build ----------
FROM node:20-alpine AS builder
WORKDIR /app
RUN apk add --no-cache python3 make g++ libc6-compat
RUN corepack disable && npm i -g npm@latest

ENV NODE_ENV=development
COPY package*.json ./
RUN npm ci --no-audit --no-fund

COPY tsconfig*.json ./
COPY src ./src
RUN npm run build

# Tạo node_modules production
RUN npm prune --omit=dev

# ---------- Stage 2: Runtime ----------
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Retry tối đa 3 lần nếu mirror lỗi tạm thời
RUN set -eux; \
  for i in 1 2 3; do \
    apk update && apk add --no-cache libc6-compat && break || (echo "apk retry $i/3"; sleep 5); \
  done

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

EXPOSE 3001
CMD ["node", "dist/main"]