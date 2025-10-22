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

# Tạo node_modules production để dùng lại ở runner
RUN npm prune --omit=dev

# ---------- Stage 2: Runtime ----------
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# (Tùy chọn) cài libc6-compat nếu native addon cần
RUN apk add --no-cache libc6-compat

# Copy đúng thứ tự để giữ integrity
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

EXPOSE 3000
CMD ["node", "dist/main"]
