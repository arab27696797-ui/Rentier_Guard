/**
 * Централизованная обработка ошибок для RentierGuard Bot
 * Перехватывает и логирует ошибки, отправляет понятные сообщения пользователю
 */

import type { MiddlewareFn } from 'telegraf';
import type { BotContext } from '@types/index';
import { ErrorCode, AppError } from '@types/index';
import { createModuleLogger } from '@core/utils/logger';

// ============================================================================
// Логгер модуля
// ============================================================================

const logger = createModuleLogger('ErrorMiddleware');

// ============================================================================
// Сообщения об ошибках для пользователя
// ============================================================================

/**
 * Сообщения об ошибках на разных языках
 */
const ERROR_MESSAGES: Record<ErrorCode, string> = {
  [ErrorCode.UNAUTHORIZED]: '🔐 Требуется авторизация. Используйте команду /start',
  [ErrorCode.FORBIDDEN]: '⛔ У вас нет прав для выполнения этого действия.',
  [ErrorCode.NOT_FOUND]: '🔍 Запрашиваемые данные не найдены.',
  [ErrorCode.VALIDATION_ERROR]: '⚠️ Проверьте введенные данные и попробуйте снова.',
  [ErrorCode.DATABASE_ERROR]: '💾 Ошибка базы данных. Попробуйте позже.',
  [ErrorCode.EXTERNAL_API_ERROR]: '🌐 Ошибка внешнего сервиса. Попробуйте позже.',
  [ErrorCode.UNKNOWN_ERROR]: '❌ Произошла непредвиденная ошибка. Мы уже работаем над ней.',
};

/**
 * Дополнительные сообщения для технических ошибок (только для dev)
 */
const DEV_ERROR_MESSAGES: Record<string, string> = {
  NETWORK_ERROR: '📡 Проблема с сетью. Проверьте подключение.',
  TIMEOUT_ERROR: '⏱️ Запрос занял слишком много времени. Попробуйте позже.',
  RATE_LIMIT: '🚫 Слишком много запросов. Подождите немного.',
};

// ============================================================================
// Интерфейсы
// ============================================================================

/**
 * Информация об ошибке для логирования
 */
interface ErrorInfo {
  code: ErrorCode | string;
  message: string;
  stack?: string;
  userId?: string | null;
  telegramId?: number;
  scene?: string;
  command?: string;
}

/**
 * Опции middleware обработки ошибок
 */
interface ErrorMiddlewareOptions {
  /** Отправлять детали ошибки в dev режиме */
  showDetailsInDev?: boolean;
  /** Дополнительный обработчик ошибок */
  onError?: (error: Error, ctx: BotContext) => void | Promise<void>;
  /** Игнорируемые типы ошибок */
  ignoredErrors?: string[];
}

// ============================================================================
// Обработка различных типов ошибок
// ============================================================================

/**
 * Классифицирует ошибку и возвращает код
 */
function classifyError(error: Error): ErrorCode {
  // Prisma ошибки
  if (error.message?.includes('P2002')) {
    return ErrorCode.DATABASE_ERROR; // Unique constraint violation
  }
  if (error.message?.includes('P2025')) {
    return ErrorCode.NOT_FOUND; // Record not found
  }
  if (error.message?.includes('P2003')) {
    return ErrorCode.VALIDATION_ERROR; // Foreign key constraint
  }

  // Ошибки валидации Zod
  if (error.name === 'ZodError') {
    return ErrorCode.VALIDATION_ERROR;
  }

  // Ошибки Telegraf
  if (error.message?.includes('403')) {
    return ErrorCode.FORBIDDEN;
  }
  if (error.message?.includes('400')) {
    return ErrorCode.VALIDATION_ERROR;
  }

  // Сетевые ошибки
  if (error.message?.includes('ECONNREFUSED') || error.message?.includes('ETIMEDOUT')) {
    return ErrorCode.EXTERNAL_API_ERROR;
  }

  // Ошибки приложения
  if (error instanceof AppError) {
    return error.code;
  }

  return ErrorCode.UNKNOWN_ERROR;
}

/**
 * Получает сообщение для пользователя на основе кода ошибки
 */
function getUserMessage(code: ErrorCode, error?: Error): string {
  const baseMessage = ERROR_MESSAGES[code] || ERROR_MESSAGES[ErrorCode.UNKNOWN_ERROR];

  // В dev режиме добавляем детали
  if (process.env.NODE_ENV === 'development' && error) {
    return `${baseMessage}\n\n🛠️ *Dev info:* \`${error.message}\``;
  }

  return baseMessage;
}

/**
 * Формирует информацию об ошибке для логирования
 */
function createErrorInfo(error: Error, ctx: BotContext): ErrorInfo {
  return {
    code: error instanceof AppError ? error.code : classifyError(error),
    message: error.message,
    stack: error.stack,
    userId: ctx.session?.userId,
    telegramId: ctx.from?.id,
    scene: ctx.scene?.current?.id,
    command: ctx.message && 'text' in ctx.message ? ctx.message.text : undefined,
  };
}

// ============================================================================
// Основной middleware обработки ошибок
// ============================================================================

/**
 * Создает middleware для централизованной обработки ошибок
 * @param options - Опции middleware
 */
export function createErrorMiddleware(
  options: ErrorMiddlewareOptions = {}
): MiddlewareFn<BotContext> {
  const { showDetailsInDev = true, onError, ignoredErrors = [] } = options;

  return async (ctx, next) => {
    try {
      await next();
    } catch (error) {
      // Проверяем, нужно ли игнорировать эту ошибку
      if (error instanceof Error && ignoredErrors.includes(error.name)) {
        return;
      }

      // Логируем ошибку
      const errorInfo = createErrorInfo(error as Error, ctx);
      logger.error(errorInfo, 'Ошибка в обработке запроса');

      // Вызываем кастомный обработчик если есть
      if (onError) {
        await onError(error as Error, ctx);
      }

      // Отправляем сообщение пользователю
      await sendErrorMessage(ctx, error as Error, showDetailsInDev);

      // Сбрасываем сцену при критических ошибках
      await handleCriticalError(ctx, error as Error);
    }
  };
}

/**
 * Отправляет сообщение об ошибке пользователю
 */
async function sendErrorMessage(
  ctx: BotContext,
  error: Error,
  showDetails: boolean
): Promise<void> {
  try {
    const code = classifyError(error);
    let message = getUserMessage(code, showDetails ? error : undefined);

    // Добавляем рекомендации для пользователя
    message += '\n\nЕсли ошибка повторяется, обратитесь в поддержку: @rentierguard_support';

    // Удаляем предыдущее сообщение бота если возможно
    if (ctx.callbackQuery) {
      await ctx.answerCbQuery('Произошла ошибка').catch(() => {
        // Игнорируем ошибки при ответе на callback
      });
    }

    // Отправляем новое сообщение
    await ctx.reply(message, { parse_mode: 'Markdown' });
  } catch (sendError) {
    // Если не удалось отправить сообщение, логируем
    logger.error({ sendError }, 'Не удалось отправить сообщение об ошибке');
  }
}

/**
 * Обрабатывает критические ошибки (сброс сцены и т.д.)
 */
async function handleCriticalError(ctx: BotContext, error: Error): Promise<void> {
  const code = classifyError(error);

  // При критических ошибках сбрасываем сцену
  if (code === ErrorCode.DATABASE_ERROR || code === ErrorCode.UNKNOWN_ERROR) {
    try {
      await ctx.scene.leave();
      logger.debug('Сцена сброшена после критической ошибки');
    } catch {
      // Игнорируем ошибки при сбросе сцены
    }
  }
}

// ============================================================================
// Middleware для обработки ошибок в сценах
// ============================================================================

/**
 * Обертка для wizard шагов с обработкой ошибок
 * @param stepFn - Функция шага wizard
 * @param errorHandler - Кастомный обработчик ошибок
 */
export function withErrorHandling(
  stepFn: (ctx: BotContext) => Promise<void>,
  errorHandler?: (error: Error, ctx: BotContext) => Promise<void>
): (ctx: BotContext) => Promise<void> {
  return async (ctx: BotContext): Promise<void> => {
    try {
      await stepFn(ctx);
    } catch (error) {
      const errorInfo = createErrorInfo(error as Error, ctx);
      logger.error(errorInfo, 'Ошибка в шаге wizard');

      if (errorHandler) {
        await errorHandler(error as Error, ctx);
      } else {
        const code = classifyError(error as Error);
        await ctx.reply(getUserMessage(code, error as Error));
      }
    }
  };
}

// ============================================================================
// Утилиты для обработки ошибок
// ============================================================================

/**
 * Безопасно выполняет асинхронную функцию
 * @param fn - Функция для выполнения
 * @param fallback - Значение по умолчанию при ошибке
 */
export async function safeExecute<T>(
  fn: () => Promise<T>,
  fallback: T
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    logger.error({ error }, 'Ошибка в safeExecute');
    return fallback;
  }
}

/**
 * Проверяет, является ли ошибка ошибкой валидации
 */
export function isValidationError(error: Error): boolean {
  return classifyError(error) === ErrorCode.VALIDATION_ERROR;
}

/**
 * Проверяет, является ли ошибка ошибкой доступа
 */
export function isAuthError(error: Error): boolean {
  const code = classifyError(error);
  return code === ErrorCode.UNAUTHORIZED || code === ErrorCode.FORBIDDEN;
}

// ============================================================================
// Предустановленный middleware
// ============================================================================

/**
 * Стандартный middleware обработки ошибок
 */
export const errorMiddleware = createErrorMiddleware();

/**
 * Middleware для разработки с детальными ошибками
 */
export const devErrorMiddleware = createErrorMiddleware({
  showDetailsInDev: true,
});
