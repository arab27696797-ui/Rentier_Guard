/**
 * Модуль экспертов для RentierGuard Bot
 * 
 * Предоставляет функционал для запроса консультаций у экспертов:
 * - Юрист ⚖️
 * - Налоговый консультант 💼
 * - Бухгалтер 📊
 * 
 * @module ExpertModule
 */

// ============================================
// ТИПЫ И ИНТЕРФЕЙСЫ
// ============================================

export {
  // Enums
  ExpertType,
  ExpertRequestStatus,
  RequestPriority,
  
  // Interfaces
  type ExpertRequestData,
  type ExpertNotification,
  type CreateRequestResult,
  type FreeConsultationInfo,
  type ExpertWizardSession,
  type ExpertWizardContext,
  type NotificationOptions,
  type NotificationChannelConfig,
  type RequestFilter,
  type UserRequestStats,
} from './types';

// ============================================
// ВАЛИДАТОРЫ (ZOD СХЕМЫ)
// ============================================

export {
  // Схемы
  expertTypeSchema,
  expertRequestStatusSchema,
  requestPrioritySchema,
  descriptionSchema,
  detailsSchema,
  userIdSchema,
  usernameSchema,
  expertRequestSchema,
  updateRequestStatusSchema,
  freeConsultationSchema,
  requestFilterSchema,
  expertTypeCallbackSchema,
  confirmCallbackSchema,
  skipCallbackSchema,
  
  // Типы
  type ExpertRequestInput,
  type UpdateRequestStatusInput,
  
  // Утилиты
  parseCallbackData,
  validateWithErrors,
} from './validators';

// ============================================
// СЦЕНЫ
// ============================================

export {
  // Сцена запроса к эксперту
  expertRequestScene,
  EXPERT_REQUEST_SCENE,
} from './scenes/expertRequest.scene';

// ============================================
// СЕРВИСЫ
// ============================================

export { ExpertService } from './services/expert.service';
export { NotificationService } from './services/notification.service';

// ============================================
// ШАБЛОНЫ СООБЩЕНИЙ
// ============================================

export {
  getExpertWelcomeMessage,
  getExpertTypeSelectionMessage,
  getDescriptionRequestMessage,
  getDetailsRequestMessage,
  getConfirmationMessage,
  getRequestSentMessage,
  getFreeLimitExceededMessage,
  getErrorMessage,
  getUserRequestsListMessage,
  getRequestDetailsMessage,
  getExpertTypeEmoji,
  getExpertTypeLabel,
  getStatusInfoMessage,
  getAdminRequestsListMessage,
} from './templates/messages';

// ============================================
// КОНФИГУРАЦИЯ МОДУЛЯ
// ============================================

/**
 * Конфигурация модуля экспертов
 */
export interface ExpertModuleConfig {
  /** Токен бота для уведомлений (может отличаться от основного) */
  botToken?: string;
  /** ID канала/группы для уведомлений экспертов */
  expertsChannelId: string;
  /** ID топика в супергруппе */
  messageThreadId?: number;
  /** URL вебхука для уведомлений */
  webhookUrl?: string;
  /** Максимальная длина описания */
  maxDescriptionLength?: number;
  /** Максимальная длина деталей */
  maxDetailsLength?: number;
  /** Количество бесплатных консультаций в год */
  freeConsultationsPerYear?: number;
}

/**
 * Дефолтная конфигурация
 */
export const defaultExpertConfig: ExpertModuleConfig = {
  expertsChannelId: '',
  maxDescriptionLength: 2000,
  maxDetailsLength: 3000,
  freeConsultationsPerYear: 1,
};

/**
 * Инициализировать модуль экспертов
 * @param config - конфигурация модуля
 */
export function initExpertModule(config: Partial<ExpertModuleConfig> = {}): {
  config: ExpertModuleConfig;
  isConfigured: boolean;
} {
  const mergedConfig = { ...defaultExpertConfig, ...config };
  
  const isConfigured = !!(
    mergedConfig.expertsChannelId ||
    mergedConfig.webhookUrl
  );

  if (!isConfigured) {
    console.warn('[ExpertModule] Модуль экспертов не полностью настроен. Укажите expertsChannelId или webhookUrl');
  }

  return {
    config: mergedConfig,
    isConfigured,
  };
}

// ============================================
// ВЕРСИЯ МОДУЛЯ
// ============================================

export const EXPERT_MODULE_VERSION = '1.0.0';

// ============================================
// ДОКУМЕНТАЦИЯ ПО ИСПОЛЬЗОВАНИЮ
// ============================================

/**
 * @example
 * 
 * // Подключение модуля в основном боте:
 * import { Telegraf, Scenes } from 'telegraf';
 * import { expertRequestScene, ExpertService, NotificationService } from './modules/expert';
 * 
 * // Создание сессии
 * const session = require('telegraf/session');
 * 
 * // Создание Stage
 * const stage = new Scenes.Stage([expertRequestScene]);
 * 
 * // Инициализация бота
 * const bot = new Telegraf(process.env.BOT_TOKEN);
 * bot.use(session());
 * bot.use(stage.middleware());
 * 
 * // Команда для входа в сцену
 * bot.command('expert', (ctx) => ctx.scene.enter('expert_request_scene'));
 * 
 * // Инициализация сервисов
 * const expertService = new ExpertService();
 * const notificationService = new NotificationService({
 *   botToken: process.env.EXPERTS_BOT_TOKEN,
 *   expertsChannelId: process.env.EXPERTS_CHANNEL_ID,
 * });
 * 
 * // Получение списка запросов пользователя
 * bot.command('myrequests', async (ctx) => {
 *   const requests = await expertService.getUserRequests(ctx.from.id);
 *   // ... отправка списка
 * });
 */
