FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install --legacy-peer-deps

COPY . .
RUN npm run build

FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --only=production --legacy-peer-deps

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/config ./config

EXPOSE 3010

CMD ["node", "dist/main"]
