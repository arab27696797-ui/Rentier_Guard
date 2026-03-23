/**
 * Error Middleware
 */

import { MiddlewareFn, Context } from 'telegraf';
import { logger } from '../utils/logger';

export const errorMiddleware: MiddlewareFn<Context> = async (ctx, next) => {
  try {
    await next();
  } catch (error) {
    logger.error({ error, userId: ctx.from?.id }, 'Error in bot handler');
    try {
      await ctx.reply('❌ Произошла ошибка. Пожалуйста, попробуйте позже.');
    } catch {
      // Can't send message to user, ignore
    }
  }
};

export enum ErrorCode {
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_API_ERROR = 'EXTERNAL_API_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: ErrorCode,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AppError';
  }
}
