# ============================================
# RentierGuard - Multi-stage Dockerfile
# ============================================
# Оптимизирован для Railway и production деплоя
# ============================================

# --------------------------------------------
# Stage 1: Dependencies
# --------------------------------------------
FROM node:18-alpine AS deps

# Установка необходимых пакетов для сборки
RUN apk add --no-cache libc6-compat openssl

WORKDIR /app

# Копируем файлы зависимостей
COPY package.json ./
COPY prisma ./prisma/

# Устанавливаем зависимости (npm install вместо npm ci)
RUN npm install && npm cache clean --force

# --------------------------------------------
# Stage 2: Builder
# --------------------------------------------
FROM node:18-alpine AS builder

# Установка необходимых пакетов
RUN apk add --no-cache libc6-compat openssl

WORKDIR /app

# Копируем зависимости из предыдущего stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package.json ./
COPY prisma ./prisma/

# Копируем исходный код
COPY . .

# Генерируем Prisma клиент
RUN npx prisma generate

# Собираем TypeScript
RUN npm run build

# --------------------------------------------
# Stage 3: Production
# --------------------------------------------
FROM node:18-alpine AS runner

# Установка необходимых пакетов для production
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    dumb-init

# Настройка Puppeteer
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Создаем непривилегированного пользователя
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 botuser

WORKDIR /app

# Копируем необходимые файлы
COPY --from=builder --chown=botuser:nodejs /app/dist ./dist
COPY --from=builder --chown=botuser:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=botuser:nodejs /app/package.json ./
COPY --from=builder --chown=botuser:nodejs /app/prisma ./prisma

# Копируем шаблоны документов
COPY --chown=botuser:nodejs assets/templates ./assets/templates

# Создаем директорию для выходных файлов
RUN mkdir -p /app/output && chown -R botuser:nodejs /app/output

# Переключаемся на непривилегированного пользователя
USER botuser

# Открываем порт (Railway назначит свой)
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Запускаем с dumb-init для корректной обработки сигналов
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/index.js"]
