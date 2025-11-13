# Dockerfile
# Build from root context: docker build -f Payment_Service/Dockerfile -t payment-service:dev .

FROM node:20-alpine AS builder
WORKDIR /app
RUN apk add --no-cache python3 make g++ libc6-compat
RUN corepack disable && npm i -g npm@latest

ENV NODE_ENV=development

# Build shared events package
COPY libs/events /app/libs/events
WORKDIR /app/libs/events
RUN npm install && npm run build

# Build Payment Service
WORKDIR /app/payment-service
COPY Payment_Service/package*.json ./
RUN npm ci --no-audit --no-fund

# Install shared events from local
RUN npm install file:/app/libs/events

COPY Payment_Service/tsconfig*.json ./
COPY Payment_Service/src ./src
RUN npm run build

RUN npm prune --omit=dev

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN set -eux; \
  for i in 1 2 3; do \
    apk update && apk add --no-cache libc6-compat && break || (echo "apk retry $i/3"; sleep 5); \
  done

COPY --from=builder /app/payment-service/package*.json ./
COPY --from=builder /app/payment-service/node_modules ./node_modules
COPY --from=builder /app/payment-service/dist ./dist
# Copy shared events package
RUN mkdir -p node_modules/@ccm
COPY --from=builder /app/libs/events ./node_modules/@ccm/events

EXPOSE 3002
CMD ["node", "dist/main"]