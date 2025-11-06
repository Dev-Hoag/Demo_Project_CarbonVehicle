
# Dockerfile
# Build from root context: docker build -f User_Service/Dockerfile -t user-service:dev .

# ---------- Stage 1: Build ----------
FROM node:20-alpine AS builder
WORKDIR /app
RUN apk add --no-cache python3 make g++ libc6-compat
RUN corepack disable && npm i -g npm@latest

ENV NODE_ENV=development

# Copy shared events package first
COPY libs/events /app/libs/events
WORKDIR /app/libs/events
RUN npm install && npm run build

# Build User Service
WORKDIR /app/user-service
COPY User_Service/package*.json ./
RUN npm ci --no-audit --no-fund

# Install shared events from local
RUN npm install file:/app/libs/events

COPY User_Service/tsconfig*.json ./
COPY User_Service/src ./src
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

COPY --from=builder /app/user-service/package*.json ./
COPY --from=builder /app/user-service/node_modules ./node_modules
COPY --from=builder /app/user-service/dist ./dist

# Copy shared events package
RUN mkdir -p node_modules/@ccm
COPY --from=builder /app/libs/events ./node_modules/@ccm/events

EXPOSE 3001
CMD ["node", "dist/main"]