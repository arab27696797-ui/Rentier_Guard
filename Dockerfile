# ============================================
# RentierGuard - Multi-stage Dockerfile
# ============================================

# Stage 1: Build
FROM node:18-alpine AS builder

RUN apk add --no-cache libc6-compat openssl

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

# Install ALL dependencies (including dev) for build
RUN npm install

# Generate Prisma client
RUN npx prisma generate

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Stage 2: Production
FROM node:18-alpine AS runner

RUN apk add --no-cache openssl dumb-init

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 botuser

WORKDIR /app

COPY --from=builder --chown=botuser:nodejs /app/dist ./dist
COPY --from=builder --chown=botuser:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=botuser:nodejs /app/package*.json ./
COPY --from=builder --chown=botuser:nodejs /app/prisma ./prisma
COPY --from=builder --chown=botuser:nodejs /app/assets ./assets

RUN mkdir -p /app/output && chown -R botuser:nodejs /app/output

USER botuser

ENTRYPOINT ["dumb-init", "--"]
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js 2>&1 || echo EXIT_CODE=$?; sleep 30"]
