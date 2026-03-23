/**
 * Логгер приложения RentierGuard
 * Использует pino для структурированного логирования
 */

import pino from 'pino';

// ============================================================================
// Конфигурация логгера
// ============================================================================

const isDevelopment = process.env.NODE_ENV !== 'production';

/**
 * Уровень логирования из переменной окружения или по умолчанию
 */
const LOG_LEVEL = process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info');

/**
 * Базовая конфигурация логгера
 */
const loggerConfig: pino.LoggerOptions = {
  level: LOG_LEVEL,
  base: {
    pid: process.pid,
    env: process.env.NODE_ENV || 'development',
  },
  timestamp: pino.stdTimeFunctions.isoTime,
};

// ============================================================================
// Создание логгера
// ============================================================================

/**
 * Основной логгер приложения
 */
export const logger = pino({
  ...loggerConfig,
  transport: isDevelopment
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      }
    : undefined,
});

// ============================================================================
// Вспомогательные функции логирования
// ============================================================================

/**
 * Логирование с контекстом модуля
 * @param moduleName - Название модуля
 * @returns Логгер с привязанным контекстом
 */
export function createModuleLogger(moduleName: string): pino.Logger {
  return logger.child({ module: moduleName });
}

/**
 * Логирование с контекстом пользователя
 * @param userId - ID пользователя
 * @param telegramId - Telegram ID пользователя
 * @returns Логгер с привязанным контекстом пользователя
 */
export function createUserLogger(userId: string, telegramId: number): pino.Logger {
  return logger.child({ userId, telegramId });
}

/**
 * Логирование ошибок с дополнительным контекстом
 * @param error - Объект ошибки
 * @param context - Дополнительный контекст
 */
export function logError(
  error: Error,
  context?: Record<string, unknown>
): void {
  logger.error(
    {
      err: {
        message: error.message,
        stack: error.stack,
        name: error.name,
      },
      ...context,
    },
    error.message
  );
}

/**
 * Логирование запросов к боту
 * @param ctx - Контекст Telegraf
 * @param action - Действие пользователя
 */
export function logUserAction(
  telegramId: number,
  action: string,
  metadata?: Record<string, unknown>
): void {
  logger.info(
    {
      telegramId,
      action,
      ...metadata,
    },
    `User action: ${action}`
  );
}

// ============================================================================
// Экспорт типов
// ============================================================================

export type { Logger } from 'pino';
