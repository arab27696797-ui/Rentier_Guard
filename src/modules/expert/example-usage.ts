/**
 * Пример использования модуля экспертов
 * RentierGuard Bot
 */

import { Telegraf, Scenes, session } from 'telegraf';
import {
  expertRequestScene,
  EXPERT_REQUEST_SCENE,
  ExpertService,
  NotificationService,
  getUserRequestsListMessage,
  getRequestDetailsMessage,
  getErrorMessage,
} from './index';

// ============================================
// ИНИЦИАЛИЗАЦИЯ БОТА
// ============================================

const bot = new Telegraf<Scenes.WizardContext>(process.env.BOT_TOKEN!);

// Создание Stage и регистрация сцен
const stage = new Scenes.Stage<Scenes.WizardContext>([expertRequestScene], {
  default: 'expert_request_scene',
});

// Middleware
bot.use(session());
bot.use(stage.middleware());

// ============================================
// ИНИЦИАЛИЗАЦИЯ СЕРВИСОВ
// ============================================

const expertService = new ExpertService();
const notificationService = new NotificationService({
  botToken: process.env.EXPERTS_BOT_TOKEN,
  expertsChannelId: process.env.EXPERTS_CHANNEL_ID!,
  messageThreadId: process.env.EXPERTS_THREAD_ID
    ? parseInt(process.env.EXPERTS_THREAD_ID, 10)
    : undefined,
});

// ============================================
// КОМАНДЫ
// ============================================

/**
 * /expert — запрос к эксперту
 * Запускает WizardScene для создания запроса
 */
bot.command('expert', async (ctx) => {
  try {
    await ctx.scene.enter(EXPERT_REQUEST_SCENE);
  } catch (error) {
    console.error('[Bot] Ошибка при входе в сцену:', error);
    await ctx.reply(getErrorMessage());
  }
});

/**
 * /myrequests — список запросов пользователя
 */
bot.command('myrequests', async (ctx) => {
  try {
    const userId = ctx.from?.id;
    if (!userId) {
      await ctx.reply('❌ Не удалось определить пользователя');
      return;
    }

    const requests = await expertService.getUserRequests(userId);
    
    await ctx.reply(
      getUserRequestsListMessage(
        requests.map((r) => ({
          id: r.id,
          expertType: r.expertType,
          status: r.status,
          createdAt: r.createdAt,
          isFree: r.isFree,
        }))
      ),
      { parse_mode: 'HTML' }
    );
  } catch (error) {
    console.error('[Bot] Ошибка при получении запросов:', error);
    await ctx.reply(getErrorMessage());
  }
});

/**
 * /request [id] — детали конкретного запроса
 */
bot.command('request', async (ctx) => {
  try {
    const args = ctx.message.text.split(' ');
    const requestId = args[1];

    if (!requestId) {
      await ctx.reply(
        '❌ Укажите ID запроса\n\nПример: <code>/request abc123</code>',
        { parse_mode: 'HTML' }
      );
      return;
    }

    const request = await expertService.getRequestById(requestId);

    if (!request) {
      await ctx.reply('❌ Запрос не найден');
      return;
    }

    // Проверяем, что запрос принадлежит пользователю
    if (request.userId !== ctx.from?.id) {
      await ctx.reply('❌ У вас нет доступа к этому запросу');
      return;
    }

    await ctx.reply(
      getRequestDetailsMessage({
        id: request.id,
        expertType: request.expertType,
        description: request.description,
        details: request.details,
        status: request.status,
        createdAt: request.createdAt,
        isFree: request.isFree,
        expertComment: request.expertComment,
      }),
      { parse_mode: 'HTML' }
    );
  } catch (error) {
    console.error('[Bot] Ошибка при получении деталей:', error);
    await ctx.reply(getErrorMessage());
  }
});

/**
 * /cancelrequest [id] — отмена запроса
 */
bot.command('cancelrequest', async (ctx) => {
  try {
    const args = ctx.message.text.split(' ');
    const requestId = args[1];
    const userId = ctx.from?.id;

    if (!requestId) {
      await ctx.reply(
        '❌ Укажите ID запроса\n\nПример: <code>/cancelrequest abc123</code>',
        { parse_mode: 'HTML' }
      );
      return;
    }

    if (!userId) {
      await ctx.reply('❌ Не удалось определить пользователя');
      return;
    }

    const success = await expertService.cancelRequest(requestId, userId);

    if (success) {
      await ctx.reply('✅ Запрос успешно отменён');
    } else {
      await ctx.reply(
        '❌ Не удалось отменить запрос. Возможно, он уже завершён или не существует.'
      );
    }
  } catch (error) {
    console.error('[Bot] Ошибка при отмене:', error);
    await ctx.reply(getErrorMessage());
  }
});

// ============================================
// КОМАНДЫ ДЛЯ ЭКСПЕРТОВ (админские)
// ============================================

/**
 * /take_[id] — взять запрос в работу
 * Вызывается из канала экспертов
 */
bot.hears(/^\/take_([a-zA-Z0-9-]+)$/, async (ctx) => {
  try {
    const requestId = ctx.match[1];
    const expertId = ctx.from?.id;

    if (!expertId) {
      await ctx.reply('❌ Не удалось определить эксперта');
      return;
    }

    const updated = await expertService.updateRequestStatus(
      requestId,
      'in_progress' as import('./types').ExpertRequestStatus,
      { assignedExpertId: expertId }
    );

    if (updated) {
      await ctx.reply(`✅ Запрос ${requestId} взят в работу`);
      
      // Уведомляем пользователя
      await notificationService.notifyUserStatusChange(
        updated.userId,
        requestId,
        'in_progress' as import('./types').ExpertRequestStatus
      );
    } else {
      await ctx.reply('❌ Не удалось обновить статус запроса');
    }
  } catch (error) {
    console.error('[Bot] Ошибка при взятии в работу:', error);
    await ctx.reply(getErrorMessage());
  }
});

/**
 * /complete_[id] — завершить запрос
 */
bot.hears(/^\/complete_([a-zA-Z0-9-]+)$/, async (ctx) => {
  try {
    const requestId = ctx.match[1];
    
    const updated = await expertService.updateRequestStatus(
      requestId,
      'completed' as import('./types').ExpertRequestStatus
    );

    if (updated) {
      await ctx.reply(`✅ Запрос ${requestId} завершён`);
      
      // Уведомляем пользователя
      await notificationService.notifyUserStatusChange(
        updated.userId,
        requestId,
        'completed' as import('./types').ExpertRequestStatus,
        updated.expertComment
      );
    } else {
      await ctx.reply('❌ Не удалось завершить запрос');
    }
  } catch (error) {
    console.error('[Bot] Ошибка при завершении:', error);
    await ctx.reply(getErrorMessage());
  }
});

// ============================================
// ЗАПУСК БОТА
// ============================================

bot.launch()
  .then(() => {
    console.log('[Bot] Бот запущен');
  })
  .catch((error) => {
    console.error('[Bot] Ошибка запуска:', error);
  });

// Graceful shutdown
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

export default bot;
