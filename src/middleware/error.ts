/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * RentierGuard Bot - Middleware обработки ошибок
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Централизованная обработка ошибок в боте.
 * 
 * @author RentierGuard Team
 * @version 1.0.0
 */

import { Context, MiddlewareFn } from 'telegraf';
import { Scenes } from 'telegraf';

// Типы ошибок
export enum ErrorType {
  VALIDATION = 'VALIDATION',
  DATABASE = 'DATABASE',
  API = 'API',
  NOT_FOUND = 'NOT_FOUND',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  UNKNOWN = 'UNKNOWN',
}

// Кастомная ошибка бота
export class BotError extends Error {
  constructor(
    message: string,
    public type: ErrorType = ErrorType.UNKNOWN,
    public userMessage?: string,
    public shouldLog: boolean = true
  ) {
    super(message);
    this.name = 'BotError';
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// Middleware обработки ошибок
// ═══════════════════════════════════════════════════════════════════════════════

export const errorMiddleware: MiddlewareFn<Scenes.WizardContext> = async (ctx, next) => {
  try {
    await next();
  } catch (error) {
    await handleError(ctx, error);
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// Обработка ошибок
// ═══════════════════════════════════════════════════════════════════════════════

async function handleError(ctx: Scenes.WizardContext, error: unknown): Promise<void> {
  // Определяем тип ошибки
  const botError = normalizeError(error);
  
  // Логируем ошибку
  if (botError.shouldLog) {
    logError(ctx, botError);
  }
  
  // Отправляем сообщение пользователю
  await sendErrorMessage(ctx, botError);
}

// ═══════════════════════════════════════════════════════════════════════════════
// Нормализация ошибок
// ═══════════════════════════════════════════════════════════════════════════════

function normalizeError(error: unknown): BotError {
  // Если это уже BotError, возвращаем как есть
  if (error instanceof BotError) {
    return error;
  }
  
  // Обработка ошибок Telegraf
  if (error instanceof Error) {
    // Ошибки Telegram API
    if (error.message.includes('ETELEGRAM')) {
      if (error.message.includes('403')) {
        return new BotError(
          error.message,
          ErrorType.FORBIDDEN,
          '⛔ Бот был заблокирован пользователем.',
          true
        );
      }
      if (error.message.includes('400')) {
        return new BotError(
          error.message,
          ErrorType.VALIDATION,
          '❌ Некорректный запрос. Пожалуйста, проверьте введенные данные.',
          true
        );
      }
      if (error.message.includes('429')) {
        return new BotError(
          error.message,
          ErrorType.API,
          '⏳ Слишком много запросов. Пожалуйста, подождите немного.',
          true
        );
      }
    }
    
    // Ошибки базы данных
    if (error.message.includes('ECONNREFUSED') || 
        error.message.includes('database') ||
        error.message.includes('pg')) {
      return new BotError(
        error.message,
        ErrorType.DATABASE,
        '❌ Ошибка подключения к базе данных. Пожалуйста, попробуйте позже.',
        true
      );
    }
    
    // Ошибки валидации
    if (error.message.includes('validation') || 
        error.message.includes('invalid') ||
        error.message.includes('required')) {
      return new BotError(
        error.message,
        ErrorType.VALIDATION,
        '❌ Ошибка валидации: ' + error.message,
        true
      );
    }
    
    // Общая ошибка
    return new BotError(
      error.message,
      ErrorType.UNKNOWN,
      '❌ Произошла ошибка. Пожалуйста, попробуйте позже.',
      true
    );
  }
  
  // Неизвестная ошибка
  return new BotError(
    String(error),
    ErrorType.UNKNOWN,
    '❌ Произошла неизвестная ошибка. Пожалуйста, попробуйте позже.',
    true
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Логирование ошибок
// ═══════════════════════════════════════════════════════════════════════════════

function logError(ctx: Scenes.WizardContext, error: BotError): void {
  const userId = ctx.from?.id;
  const username = ctx.from?.username;
  const chatId = ctx.chat?.id;
  const sceneId = ctx.scene?.current?.id;
  
  const logMessage = `
❌ ОШИБКА В БОТЕ
═══════════════════════════════════════
Тип: ${error.type}
Сообщение: ${error.message}
Пользователь: ${userId} (@${username})
Чат: ${chatId}
Сцена: ${sceneId || 'нет'}
Время: ${new Date().toISOString()}
═══════════════════════════════════════
  `;
  
  console.error(logMessage);
  
  // В production можно отправлять ошибки в Sentry или другой сервис
  if (process.env.NODE_ENV === 'production' && process.env.SENTRY_DSN) {
    // sendToSentry(error, ctx);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// Отправка сообщения об ошибке
// ═══════════════════════════════════════════════════════════════════════════════

async function sendErrorMessage(ctx: Scenes.WizardContext, error: BotError): Promise<void> {
  try {
    const message = error.userMessage || '❌ Произошла ошибка. Пожалуйста, попробуйте позже.';
    
    // Добавляем кнопки действий
    const keyboard = {
      inline_keyboard: [
        [{ text: '📋 Главное меню', callback_data: 'menu_main' }],
        [{ text: '🔄 Попробовать снова', callback_data: 'retry_action' }],
        [{ text: '💬 Поддержка', callback_data: 'contact_support' }],
      ],
    };
    
    // Проверяем, можно ли отредактировать сообщение
    if (ctx.callbackQuery) {
      await ctx.editMessageText(message, {
        parse_mode: 'HTML',
        reply_markup: keyboard,
      });
    } else {
      await ctx.reply(message, {
        parse_mode: 'HTML',
        reply_markup: keyboard,
      });
    }
  } catch (sendError) {
    // Если не удалось отправить сообщение об ошибке, логируем
    console.error('❌ Не удалось отправить сообщение об ошибке:', sendError);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// Вспомогательные функции
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Создает ошибку валидации
 */
export function createValidationError(message: string): BotError {
  return new BotError(
    message,
    ErrorType.VALIDATION,
    `❌ Ошибка валидации: ${message}`,
    true
  );
}

/**
 * Создает ошибку "не найдено"
 */
export function createNotFoundError(resource: string): BotError {
  return new BotError(
    `${resource} not found`,
    ErrorType.NOT_FOUND,
    `❌ ${resource} не найден.`,
    true
  );
}

/**
 * Создает ошибку авторизации
 */
export function createUnauthorizedError(): BotError {
  return new BotError(
    'Unauthorized',
    ErrorType.UNAUTHORIZED,
    '🔐 Требуется авторизация. Используйте /start',
    true
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Экспорт
// ═══════════════════════════════════════════════════════════════════════════════

export default errorMiddleware;
