/**
 * Prisma Service
 * Сервис для управления подключением к базе данных через Prisma ORM
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '../logger';

// Глобальный экземпляр PrismaClient для предотвращения создания множества подключений
// в режиме разработки с hot-reload
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Создание экземпляра PrismaClient с расширенной конфигурацией логирования
 */
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: [
    { emit: 'event', level: 'query' },
    { emit: 'event', level: 'error' },
    { emit: 'event', level: 'info' },
    { emit: 'event', level: 'warn' },
  ],
});

// Сохраняем экземпляр в глобальном объекте для режима разработки
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

/**
 * Подписка на события Prisma для логирования
 */
prisma.$on('query', (e: { query: string; params: string; duration: number }) => {
  logger.debug('Prisma Query', {
    query: e.query,
    params: e.params,
    duration: `${e.duration}ms`,
  });
});

prisma.$on('error', (e: { message: string }) => {
  logger.error('Prisma Error', { message: e.message });
});

prisma.$on('info', (e: { message: string }) => {
  logger.info('Prisma Info', { message: e.message });
});

prisma.$on('warn', (e: { message: string }) => {
  logger.warn('Prisma Warning', { message: e.message });
});

/**
 * Инициализация подключения к базе данных
 * @returns Promise<void>
 */
export async function connectDatabase(): Promise<void> {
  try {
    await prisma.$connect();
    logger.info('✅ Успешное подключение к базе данных');
  } catch (error) {
    logger.error('❌ Ошибка подключения к базе данных', { error });
    throw error;
  }
}

/**
 * Корректное отключение от базы данных
 * @returns Promise<void>
 */
export async function disconnectDatabase(): Promise<void> {
  try {
    await prisma.$disconnect();
    logger.info('✅ Отключение от базы данных выполнено');
  } catch (error) {
    logger.error('❌ Ошибка при отключении от базы данных', { error });
    throw error;
  }
}

/**
 * Проверка состояния подключения к базе данных
 * @returns Promise<boolean> - true если подключение активно
 */
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    logger.error('❌ Проверка подключения к БД не пройдена', { error });
    return false;
  }
}

/**
 * Выполнение транзакции с автоматическим rollback при ошибке
 * @param callback - функция с операциями внутри транзакции
 * @returns Promise<T> - результат выполнения транзакции
 */
export async function executeTransaction<T>(
  callback: (tx: typeof prisma) => Promise<T>
): Promise<T> {
  return prisma.$transaction(async (tx) => {
    return callback(tx as unknown as typeof prisma);
  });
}

// Экспорт типов для удобства использования
export type { PrismaClient };
