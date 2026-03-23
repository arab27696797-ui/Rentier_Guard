/**
 * Логгер приложения RentierGuard
 * Использует pino для структурированного логирования
 */

import pino from 'pino';

const isDevelopment = process.env.NODE_ENV !== 'production';
const LOG_LEVEL = process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info');

const loggerConfig: pino.LoggerOptions = {
  level: LOG_LEVEL,
  timestamp: pino.stdTimeFunctions.isoTime,
};

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

export function createModuleLogger(moduleName: string): pino.Logger {
  return logger.child({ module: moduleName });
}

export function createUserLogger(userId: string, telegramId: number): pino.Logger {
  return logger.child({ userId, telegramId });
}

export type { Logger } from 'pino';
