/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * RentierGuard Bot - Middleware логирования
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Логирование всех входящих запросов и действий пользователей.
 * 
 * @author RentierGuard Team
 * @version 1.0.0
 */

import { MiddlewareFn } from 'telegraf';
import { Scenes } from 'telegraf';

// ═══════════════════════════════════════════════════════════════════════════════
// Middleware логирования
// ═══════════════════════════════════════════════════════════════════════════════

export const loggingMiddleware: MiddlewareFn<Scenes.WizardContext> = async (ctx, next) => {
  const startTime = Date.now();
  
  // Логируем входящий запрос
  logRequest(ctx);
  
  try {
    await next();
    
    // Логируем успешное выполнение
    const duration = Date.now() - startTime;
    logSuccess(ctx, duration);
  } catch (error) {
    // Логируем ошибку
    logError(ctx, error);
    throw error;
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// Логирование запросов
// ═══════════════════════════════════════════════════════════════════════════════

function logRequest(ctx: Scenes.WizardContext): void {
  const userId = ctx.from?.id;
  const username = ctx.from?.username;
  const firstName = ctx.from?.first_name;
  
  // Определяем тип запроса
  let requestType = 'unknown';
  let requestData = '';
  
  if ('message' in ctx.update) {
    const message = ctx.update.message;
    
    if ('text' in message) {
      requestType = 'text';
      requestData = message.text;
    } else if ('photo' in message) {
      requestType = 'photo';
      requestData = `${message.photo.length} фото`;
    } else if ('document' in message) {
      requestType = 'document';
      requestData = message.document?.file_name || 'документ';
    } else if ('location' in message) {
      requestType = 'location';
      requestData = `${message.location?.latitude}, ${message.location?.longitude}`;
    } else if ('contact' in message) {
      requestType = 'contact';
      requestData = message.contact?.phone_number || 'контакт';
    }
  } else if ('callback_query' in ctx.update) {
    requestType = 'callback';
    requestData = ctx.update.callback_query?.data || '';
  }
  
  // Формируем сообщение лога
  const logMessage = `
📥 ВХОДЯЩИЙ ЗАПРОС
─────────────────────────────────
Пользователь: ${userId} (@${username}, ${firstName})
Тип: ${requestType}
Данные: ${requestData}
Сцена: ${ctx.scene?.current?.id || 'нет'}
Время: ${new Date().toISOString()}
─────────────────────────────────
  `;
  
  // В development выводим все логи
  if (process.env.NODE_ENV === 'development') {
    console.log(logMessage);
  } else {
    // В production логируем только важные события
    if (shouldLogInProduction(requestType, requestData)) {
      console.log(logMessage);
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// Логирование успешных операций
// ═══════════════════════════════════════════════════════════════════════════════

function logSuccess(ctx: Scenes.WizardContext, duration: number): void {
  const userId = ctx.from?.id;
  
  // Логируем только медленные операции (> 1 сек)
  if (duration > 1000) {
    console.log(`⚡ Медленная операция для пользователя ${userId}: ${duration}ms`);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// Логирование ошибок
// ═══════════════════════════════════════════════════════════════════════════════

function logError(ctx: Scenes.WizardContext, error: unknown): void {
  const userId = ctx.from?.id;
  const errorMessage = error instanceof Error ? error.message : String(error);
  
  console.error(`
❌ ОШИБКА ОБРАБОТКИ
─────────────────────────────────
Пользователь: ${userId}
Ошибка: ${errorMessage}
Время: ${new Date().toISOString()}
─────────────────────────────────
  `);
}

// ═══════════════════════════════════════════════════════════════════════════════
// Вспомогательные функции
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Определяет, нужно ли логировать в production
 */
function shouldLogInProduction(requestType: string, requestData: string): boolean {
  // Логируем команды
  if (requestType === 'text' && requestData.startsWith('/')) {
    return true;
  }
  
  // Логируем callback'и
  if (requestType === 'callback') {
    return true;
  }
  
  // Не логируем обычные текстовые сообщения
  return false;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Экспорт
// ═══════════════════════════════════════════════════════════════════════════════

export default loggingMiddleware;
