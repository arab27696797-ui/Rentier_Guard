/**
 * Инициализация и настройка Telegram бота RentierGuard
 * Конфигурация Telegraf с сессиями и сценами
 */

import { Telegraf, Scenes, session } from 'telegraf';
import { createModuleLogger } from '../utils/logger';

// ============================================================================
// Логгер модуля
// ============================================================================

const logger = createModuleLogger('Bot');

// ============================================================================
// Интерфейсы
// ============================================================================

interface SessionData {
  userId: string | null;
  role: string | null;
  selectedPropertyId: string | null;
  wizardData: Record<string, unknown>;
  formData: Record<string, unknown>;
  lastActivity: Date;
}

type BotContext = Scenes.WizardContext & {
  session: SessionData;
};

// ============================================================================
// Конфигурация бота
// ============================================================================

const BOT_TOKEN = process.env.BOT_TOKEN;

if (!BOT_TOKEN) {
  throw new Error('BOT_TOKEN не задан в переменных окружения');
}

const BOT_MODE = process.env.BOT_MODE || 'polling';

// ============================================================================
// Создание экземпляра бота
// ============================================================================

/**
 * Создает и настраивает экземпляр бота
 */
export function createBot(): Telegraf<BotContext> {
  logger.info('Создание экземпляра бота...');

  const bot = new Telegraf<BotContext>(BOT_TOKEN!);

  // Настройка in-memory сессий
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

  // Stage для управления сценами (сцены регистрируются в src/index.ts)
  const stage = new Scenes.Stage<BotContext>([]);
  bot.use(stage.middleware());

  logger.info('Бот успешно создан');
  return bot;
}

// ============================================================================
// Запуск бота
// ============================================================================

/**
 * Запускает бота в указанном режиме
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

async function launchPolling(bot: Telegraf<BotContext>): Promise<void> {
  logger.info('Запуск бота в режиме polling...');

  await bot.launch({
    dropPendingUpdates: true,
  });

  logger.info('Бот успешно запущен в режиме polling');
}

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
