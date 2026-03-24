/**
 * Логгер приложения RentierGuard
 * Использует pino для структурированного логирования
 */

import pino from 'pino';
import type { Logger as PinoLogger } from 'pino';

const isDevelopment = process.env.NODE_ENV !== 'production';
const logLevel = process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info');

const loggerConfig: pino.LoggerOptions = {
  level: logLevel,
  timestamp: pino.stdTimeFunctions.isoTime,
};

export const logger: PinoLogger = pino({
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

export function createModuleLogger(moduleName: string): PinoLogger {
  return logger.child({ module: moduleName });
}

export function createUserLogger(userId: string, telegramId: number): PinoLogger {
  return logger.child({ userId, telegramId });
}

export type Logger = PinoLogger;
