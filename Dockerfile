# SpendTrack AI v7.2 — Multi-Stage Production Dockerfile (Node 22)

# Stage 1: Dependencies
FROM node:22-alpine AS deps
WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci

# Stage 2: Builder
FROM node:22-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npx prisma generate
RUN npm run build

# Stage 3: Production Runner
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Install wget for healthcheck if needed
RUN apk add --no-cache wget

# Copy package manifests and production build artifacts
COPY package*.json ./
COPY prisma ./prisma/
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules

# Enforce non-root security policy
USER node

EXPOSE 3000

# Container Healthcheck targeting Express GET /api/health
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

CMD ["node", "dist/server.js"]
