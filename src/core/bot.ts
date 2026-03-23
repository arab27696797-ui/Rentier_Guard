/**
 * Инициализация и настройка Telegram бота RentierGuard
 * Конфигурация Telegraf с сессиями и сценами
 */

import { Telegraf, Scenes, session } from 'telegraf';
import { LocalSession } from 'telegraf-session-local';
import type { BotContext, SessionData } from '@types/index';
import { createModuleLogger } from '@core/utils/logger';

// ============================================================================
// Логгер модуля
// ============================================================================

const logger = createModuleLogger('Bot');

// ============================================================================
// Конфигурация бота
// ============================================================================

/** Токен бота из переменных окружения */
const BOT_TOKEN = process.env.BOT_TOKEN;

if (!BOT_TOKEN) {
  throw new Error('BOT_TOKEN не задан в переменных окружения');
}

/** Режим работы бота */
const BOT_MODE = process.env.BOT_MODE || 'polling';

// ============================================================================
// Создание экземпляра бота
// ============================================================================

/**
 * Создает и настраивает экземпляр бота
 * @returns Настроенный экземпляр Telegraf
 */
export function createBot(): Telegraf<BotContext> {
  logger.info('Создание экземпляра бота...');

  const bot = new Telegraf<BotContext>(BOT_TOKEN);

  // Настройка сессий
  setupSession(bot);

  // Настройка сцен
  setupScenes(bot);

  logger.info('Бот успешно создан');
  return bot;
}

// ============================================================================
// Настройка сессий
// ============================================================================

/**
 * Настраивает сессии для бота
 * @param bot - Экземпляр бота
 */
function setupSession(bot: Telegraf<BotContext>): void {
  const sessionType = process.env.SESSION_TYPE || 'memory';

  if (sessionType === 'redis') {
    // Redis сессии для production
    setupRedisSession(bot);
  } else if (sessionType === 'local') {
    // Локальные файловые сессии
    setupLocalSession(bot);
  } else {
    // In-memory сессии (по умолчанию для разработки)
    setupMemorySession(bot);
  }
}

/**
 * Настраивает in-memory сессии
 */
function setupMemorySession(bot: Telegraf<BotContext>): void {
  logger.info('Используются in-memory сессии');

  bot.use(
    session({
      defaultSession: (): SessionData => ({
        userId: null,
        role: null,
        selectedPropertyId: null,
        wizardData: {},
        formData: {},
        lastActivity: new Date(),
      }),
    })
  );
}

/**
 * Настраивает локальные файловые сессии
 */
function setupLocalSession(bot: Telegraf<BotContext>): void {
  logger.info('Используются локальные файловые сессии');

  const localSession = new LocalSession<BotContext>({
    database: 'sessions.json',
    property: 'session',
    storage: LocalSession.storageFileAsync,
    format: {
      serialize: (obj: unknown) => JSON.stringify(obj, null, 2),
      deserialize: (str: string) => JSON.parse(str),
    },
    state: {
      userId: null,
      role: null,
      selectedPropertyId: null,
      wizardData: {},
      formData: {},
      lastActivity: new Date(),
    },
  });

  bot.use(localSession.middleware());
}

/**
 * Настраивает Redis сессии
 */
function setupRedisSession(bot: Telegraf<BotContext>): void {
  logger.info('Используются Redis сессии');
  // Здесь можно добавить Redis сессии при необходимости
  // Например, используя telegraf-session-redis
  setupMemorySession(bot);
}

// ============================================================================
// Настройка сцен
// ============================================================================

/**
 * Настраивает сцены для бота
 * @param bot - Экземпляр бота
 */
function setupScenes(bot: Telegraf<BotContext>): void {
  // Stage для управления сценами
  const stage = new Scenes.Stage<BotContext>([], {
    default: 'main_menu',
  });

  bot.use(stage.middleware());

  logger.info('Сцены настроены');
}

// ============================================================================
// Запуск бота
// ============================================================================

/**
 * Запускает бота в указанном режиме
 * @param bot - Экземпляр бота
 */
export async function launchBot(bot: Telegraf<BotContext>): Promise<void> {
  try {
    if (BOT_MODE === 'webhook') {
      await launchWebhook(bot);
    } else {
      await launchPolling(bot);
    }
  } catch (error) {
    logger.error({ error }, 'Ошибка запуска бота');
    throw error;
  }
}

/**
 * Запускает бота в режиме polling
 */
async function launchPolling(bot: Telegraf<BotContext>): Promise<void> {
  logger.info('Запуск бота в режиме polling...');

  await bot.launch({
    dropPendingUpdates: true,
  });

  logger.info('Бот успешно запущен в режиме polling');
}

/**
 * Запускает бота в режиме webhook
 */
async function launchWebhook(bot: Telegraf<BotContext>): Promise<void> {
  const webhookUrl = process.env.WEBHOOK_URL;
  const webhookPort = parseInt(process.env.WEBHOOK_PORT || '3000', 10);

  if (!webhookUrl) {
    throw new Error('WEBHOOK_URL не задан для режима webhook');
  }

  logger.info({ webhookUrl, webhookPort }, 'Запуск бота в режиме webhook...');

  await bot.launch({
    webhook: {
      domain: webhookUrl,
      port: webhookPort,
    },
  });

  logger.info('Бот успешно запущен в режиме webhook');
}

// ============================================================================
// Graceful shutdown
// ============================================================================

/**
 * Настраивает graceful shutdown для бота
 * @param bot - Экземпляр бота
 */
export function setupGracefulShutdown(bot: Telegraf<BotContext>): void {
  const shutdown = async (signal: string): Promise<void> => {
    logger.info({ signal }, 'Получен сигнал завершения');
    await bot.stop(signal);
    logger.info('Бот остановлен');
    process.exit(0);
  };

  process.once('SIGINT', () => void shutdown('SIGINT'));
  process.once('SIGTERM', () => void shutdown('SIGTERM'));
}

// ============================================================================
// Экспорт готового бота
// ============================================================================

/**
 * Готовый к использованию экземпляр бота
 */
export const bot = createBot();
