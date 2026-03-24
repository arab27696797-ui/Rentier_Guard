/**
 * RentierGuard Bot - Minimal Stable Entry Point
 * Временное минимальное ядро для успешной сборки и деплоя
 */

import { Telegraf } from 'telegraf';
import dotenv from 'dotenv';

dotenv.config();

import { logger } from './core/utils/logger';
import { prisma } from './core/services/prisma.service';
import { findOrCreateUser } from './core/services/user.service';

const BOT_TOKEN = process.env.BOT_TOKEN;
const DATABASE_URL = process.env.DATABASE_URL;

if (!BOT_TOKEN) {
  logger.error('Missing required environment variable: BOT_TOKEN');
  process.exit(1);
}

if (!DATABASE_URL) {
  logger.error('Missing required environment variable: DATABASE_URL');
  process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);

function getMainMenuText(firstName?: string | null): string {
  const safeName = firstName?.trim() ? firstName.trim() : 'Рантье';

  return [
    `🏠 <b>RentierGuard</b>`,
    '',
    `Здравствуйте, <b>${safeName}</b>.`,
    '',
    'Сейчас запущено минимальное стабильное ядро бота.',
    '',
    '<b>Доступные команды:</b>',
    '/start — регистрация и приветствие',
    '/menu — главное меню',
    '/help — справка',
    '/about — о боте',
    '/ping — проверка работы',
    '/status — статус системы',
  ].join('\n');
}

function getHelpText(): string {
  return [
    '📚 <b>Справка RentierGuard</b>',
    '',
    '/start — зарегистрировать пользователя и открыть приветствие',
    '/menu — показать главное меню',
    '/help — показать эту справку',
    '/about — информация о боте',
    '/ping — быстрая проверка ответа бота',
    '/status — состояние бота и базы данных',
  ].join('\n');
}

function getAboutText(): string {
  return [
    '🏠 <b>RentierGuard</b>',
    '',
    'Бот для арендодателей: учёт, уведомления, документы и автоматизация.',
    '',
    '<b>Текущий режим:</b> минимальное стабильное ядро',
    '<b>Версия:</b> 1.0.0',
    '',
    'Следующий этап — поочередно возвращать модули после приведения Prisma и типизации к одному формату.',
  ].join('\n');
}

bot.command('start', async (ctx) => {
  try {
    const telegramUser = ctx.from;

    if (!telegramUser) {
      await ctx.reply('❌ Не удалось определить пользователя.');
      return;
    }

    const user = await findOrCreateUser({
      id: telegramUser.id,
      first_name: telegramUser.first_name,
      last_name: telegramUser.last_name,
      username: telegramUser.username,
      language_code: telegramUser.language_code,
      is_premium: (telegramUser as { is_premium?: boolean }).is_premium,
    });

    logger.info(
      {
        telegramId: telegramUser.id,
        username: telegramUser.username ?? null,
      },
      'User started bot'
    );

    await ctx.reply(getMainMenuText(user.firstName), {
      parse_mode: 'HTML',
    });
  } catch (error) {
    logger.error({ error }, 'Error in /start command');
    await ctx.reply('❌ Произошла ошибка при запуске. Попробуйте позже.');
  }
});

bot.command('menu', async (ctx) => {
  try {
    await ctx.reply(getMainMenuText(ctx.from?.first_name), {
      parse_mode: 'HTML',
    });
  } catch (error) {
    logger.error({ error }, 'Error in /menu command');
    await ctx.reply('❌ Не удалось открыть меню.');
  }
});

bot.command('help', async (ctx) => {
  try {
    await ctx.reply(getHelpText(), {
      parse_mode: 'HTML',
    });
  } catch (error) {
    logger.error({ error }, 'Error in /help command');
    await ctx.reply('❌ Не удалось показать справку.');
  }
});

bot.command('about', async (ctx) => {
  try {
    await ctx.reply(getAboutText(), {
      parse_mode: 'HTML',
    });
  } catch (error) {
    logger.error({ error }, 'Error in /about command');
    await ctx.reply('❌ Не удалось показать информацию.');
  }
});

bot.command('ping', async (ctx) => {
  try {
    await ctx.reply('✅ Бот работает.');
  } catch (error) {
    logger.error({ error }, 'Error in /ping command');
  }
});

bot.command('status', async (ctx) => {
  try {
    let dbOk = false;

    try {
      await prisma.$queryRaw`SELECT 1`;
      dbOk = true;
    } catch (dbError) {
      logger.error({ dbError }, 'Database check failed');
    }

    const text = [
      '📊 <b>Статус системы</b>',
      '',
      `Бот: ✅ работает`,
      `База данных: ${dbOk ? '✅ подключена' : '❌ недоступна'}`,
      `Режим: <b>${process.env.NODE_ENV || 'development'}</b>`,
    ].join('\n');

    await ctx.reply(text, { parse_mode: 'HTML' });
  } catch (error) {
    logger.error({ error }, 'Error in /status command');
    await ctx.reply('❌ Не удалось получить статус.');
  }
});

bot.on('text', async (ctx) => {
  try {
    await ctx.reply(
      'Используйте команды /start, /menu, /help, /about, /ping, /status'
    );
  } catch (error) {
    logger.error({ error }, 'Error in text fallback');
  }
});

bot.catch((err, ctx) => {
  logger.error(
    {
      err,
      updateType: ctx.updateType,
    },
    'Unhandled bot error'
  );
});

async function startBot(): Promise<void> {
  try {
    await prisma.$connect();
    logger.info('Database connected successfully');

    if (process.env.NODE_ENV === 'production') {
      try {
        const { execSync } = require('child_process');
        execSync('npx prisma migrate deploy', { stdio: 'inherit' });
        logger.info('Database migrations applied');
      } catch (migrationError) {
        logger.warn({ migrationError }, 'Migration warning');
      }
    }

    await bot.launch();
    logger.info('Bot started successfully');

    process.once('SIGINT', async () => {
      logger.info('SIGINT received, shutting down...');
      bot.stop('SIGINT');
      await prisma.$disconnect();
    });

    process.once('SIGTERM', async () => {
      logger.info('SIGTERM received, shutting down...');
      bot.stop('SIGTERM');
      await prisma.$disconnect();
    });
  } catch (error) {
    logger.error({ error }, 'Failed to start bot');
    process.exit(1);
  }
}

void startBot();

export { bot };
