# ---------- Stage 1: Build ----------
FROM node:20-alpine AS builder
WORKDIR /app
RUN apk add --no-cache python3 make g++ libc6-compat
RUN corepack disable && npm i -g npm@latest

ENV NODE_ENV=development

# Copy shared events library first and build it
COPY libs/events ./libs/events
WORKDIR /app/libs/events
RUN npm install && npm run build

# Copy and install Admin Service dependencies
WORKDIR /app/admin-service
COPY Admin_Service/package*.json ./
RUN npm ci --no-audit --no-fund

COPY Admin_Service/tsconfig*.json ./
COPY Admin_Service/src ./src
RUN npm run build

# Tạo node_modules production để dùng lại ở runner
RUN npm prune --omit=dev

# Copy built libs/events vào node_modules (sau khi prune để không bị xóa)
RUN rm -rf node_modules/@ccm/events && \
    mkdir -p node_modules/@ccm && \
    cp -r /app/libs/events node_modules/@ccm/events

# ---------- Stage 2: Runtime ----------
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# (Tùy chọn) cài libc6-compat nếu native addon cần
RUN apk add --no-cache libc6-compat

# Copy shared events library
COPY --from=builder /app/libs/events ./libs/events

# Copy admin service artifacts
COPY --from=builder /app/admin-service/package*.json ./
COPY --from=builder /app/admin-service/node_modules ./node_modules
COPY --from=builder /app/admin-service/dist ./dist

EXPOSE 3000
CMD ["node", "dist/admin-service/src/main"]
