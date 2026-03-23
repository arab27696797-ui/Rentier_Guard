/**
 * RentierGuard Bot - Main Entry Point
 * Годовой комплекс сопровождения рантье
 */

import { Telegraf, Scenes, session } from 'telegraf';
import dotenv from 'dotenv';
import cron from 'node-cron';

// Load environment variables
dotenv.config();

// Core imports
import { logger } from './core/utils/logger';
import { prisma } from './core/services/prisma.service';

// Content imports
import { getWelcomeMessage, getMainMenuKeyboard } from './content/messages';
import { COMMANDS } from './content/commands';

// Module imports — scenes
import { taxScenes } from './modules/tax';
import { contractScenes } from './modules/contract';
import { propertyScenes } from './modules/property';
import { paymentScenes } from './modules/payment';
import { problemScenesArray } from './modules/problem';

// Отдельные сцены из модулей без массива
let rosreestrScenes: any[] = [];
try {
  const rc = require('./modules/rosreestr/scenes/rosreestrChecklist.scene');
  const fm = require('./modules/rosreestr/scenes/findMFC.scene');
  rosreestrScenes = [rc.default || rc.rosreestrChecklistScene, fm.default || fm.findMFCScene];
} catch (e) {
  console.warn('Rosreestr scenes not loaded:', e);
}

let expertScenes: any[] = [];
try {
  const es = require('./modules/expert/scenes/expertRequest.scene');
  expertScenes = [es.default || es.expertRequestScene];
} catch (e) {
  console.warn('Expert scenes not loaded:', e);
}

let documentScenes: any[] = [];
try {
  const ds = require('./modules/document/scenes/exportYear.scene');
  documentScenes = [ds.default || ds.exportYearScene];
} catch (e) {
  console.warn('Document scenes not loaded:', e);
}

// Services
import { findOrCreateUser } from './core/services/user.service';

// Check required environment variables
const requiredEnvVars = ['BOT_TOKEN', 'DATABASE_URL'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    logger.error(`Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
}

// Initialize bot
const bot = new Telegraf(process.env.BOT_TOKEN!);

// Collect all scenes
const allScenes: any[] = [
  ...taxScenes,
  ...contractScenes,
  ...propertyScenes,
  ...paymentScenes,
  ...rosreestrScenes,
  ...problemScenesArray,
  ...expertScenes,
  ...documentScenes,
].filter(Boolean);

// Initialize stage with all scenes
const stage = new Scenes.Stage(allScenes);

// Middleware
bot.use(session());
bot.use(stage.middleware());

// ==================== COMMANDS ====================

// /start - Welcome and registration
bot.command('start', async (ctx) => {
  try {
    const telegramUser = ctx.from;
    if (!telegramUser) {
      return ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    }

    // Find or create user in database
    const user = await findOrCreateUser({
      id: telegramUser.id,
      first_name: telegramUser.first_name,
      last_name: telegramUser.last_name,
      username: telegramUser.username,
      language_code: telegramUser.language_code,
      is_premium: (telegramUser as any).is_premium,
    });

    logger.info(`User started bot: ${telegramUser.id} (${telegramUser.username || 'no username'})`);

    const welcomeMessage = getWelcomeMessage(user.firstName || 'Рантье');

    await ctx.reply(welcomeMessage, {
      parse_mode: 'HTML',
      reply_markup: getMainMenuKeyboard(),
    });
  } catch (error) {
    logger.error('Error in /start command:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
  }
});

// /menu - Main menu
bot.command('menu', async (ctx) => {
  await ctx.reply('📋 <b>Главное меню RentierGuard</b>\n\nВыберите раздел:', {
    parse_mode: 'HTML',
    reply_markup: getMainMenuKeyboard(),
  });
});

// ==================== MODULE COMMANDS ====================

// Tax
bot.command('tax_calc', (ctx) => ctx.scene.enter('tax_calc'));
bot.command('become_selfemployed', (ctx) => ctx.scene.enter('become_selfemployed'));
bot.command('tax_report', (ctx) => ctx.scene.enter('tax_report'));

// Contracts
bot.command('create_contract', (ctx) => ctx.scene.enter('create_contract'));
bot.command('create_act', (ctx) => ctx.scene.enter('create_act'));
bot.command('create_addendum', (ctx) => ctx.scene.enter('create_addendum'));

// Properties
bot.command('add_property', (ctx) => ctx.scene.enter('add_property'));
bot.command('my_properties', (ctx) => ctx.scene.enter('my_properties'));

// Payments
bot.command('add_payment', (ctx) => ctx.scene.enter('add_payment'));
bot.command('payment_schedule', (ctx) => ctx.scene.enter('payment_schedule'));

// Rosreestr
bot.command('rosreestr_checklist', (ctx) => ctx.scene.enter('rosreestr_checklist'));
bot.command('find_mfc', (ctx) => ctx.scene.enter('find_mfc'));

// Problems
bot.command('problem', (ctx) => ctx.scene.enter('problem'));
bot.command('bad_tenant', (ctx) => ctx.scene.enter('bad_tenant'));

// Expert
bot.command('expert', (ctx) => ctx.scene.enter('expert_request_scene'));

// Documents
bot.command('export_year', (ctx) => ctx.scene.enter('export_year'));

// ==================== HELP & INFO ====================

bot.command('help', async (ctx) => {
  let helpText = '<b>📚 Справка по командам RentierGuard</b>\n\n';

  Object.entries(COMMANDS).forEach(([category, commands]) => {
    helpText += `<b>${category}:</b>\n`;
    Object.entries(commands).forEach(([command, description]) => {
      helpText += `  /${command} — ${description}\n`;
    });
    helpText += '\n';
  });

  helpText += '\n<i>💡 Нажмите /menu для открытия главного меню</i>';

  await ctx.reply(helpText, { parse_mode: 'HTML' });
});

bot.command('about', async (ctx) => {
  const aboutText = `
<b>🏠 RentierGuard</b> — Годовой комплекс сопровождения рантье

<b>Возможности:</b>
- Налоговый калькулятор (сравнение режимов)
- Регистрация самозанятого (пошаговая инструкция)
- Генерация договоров аренды
- Учет объектов и платежей
- Чек-листы для Росреестра
- Решение проблем с арендаторами
- Консультации экспертов

<b>Версия:</b> 1.0.0

<i>Информация актуальна на март 2025.
Проверяйте изменения на nalog.gov.ru и rosreestr.gov.ru</i>
  `;

  await ctx.reply(aboutText, { parse_mode: 'HTML' });
});

// ==================== CALLBACK HANDLERS ====================

bot.action('menu_main', async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.editMessageText('📋 <b>Главное меню RentierGuard</b>\n\nВыберите раздел:', {
    parse_mode: 'HTML',
    reply_markup: getMainMenuKeyboard(),
  });
});

bot.action('menu_taxes', async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.scene.enter('tax_calc');
});

bot.action('menu_contracts', async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.scene.enter('create_contract');
});

bot.action('menu_properties', async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.scene.enter('my_properties');
});

bot.action('menu_payments', async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.scene.enter('payment_schedule');
});

bot.action('menu_tools', async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.scene.enter('rosreestr_checklist');
});

bot.action('menu_support', async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.scene.enter('problem');
});

// ==================== ERROR HANDLING ====================

bot.catch((err: any, ctx: any) => {
  logger.error(`Error for ${ctx.updateType}:`, err);
  ctx.reply('❌ Произошла ошибка. Попробуйте позже.').catch(() => {});
});

// ==================== CRON JOBS ====================

function initCronJobs() {
  // Payment reminders - every 6 hours
  cron.schedule('0 */6 * * *', () => {
    logger.info('Running payment reminders check...');
    // TODO: Implement payment reminders with Prisma
  });

  // Contract expiration check - every day at 10:00
  cron.schedule('0 10 * * *', () => {
    logger.info('Running contract expiration check...');
    // TODO: Implement contract expiration notifications
  });

  logger.info('Cron jobs initialized');
}

// ==================== STARTUP & SHUTDOWN ====================

async function startBot() {
  try {
    // Check database connection
    await prisma.$connect();
    logger.info('Database connected successfully');

    // Run migrations in production
    if (process.env.NODE_ENV === 'production') {
      const { execSync } = require('child_process');
      try {
        execSync('npx prisma migrate deploy', { stdio: 'inherit' });
        logger.info('Database migrations applied');
      } catch (migrationError) {
        logger.warn('Migration warning (may be first run):', migrationError);
      }
    }

    // Launch bot
    await bot.launch();
    logger.info('Bot started successfully');

    // Initialize cron jobs
    initCronJobs();

    // Enable graceful stop
    process.once('SIGINT', () => {
      logger.info('SIGINT received, shutting down...');
      bot.stop('SIGINT');
      prisma.$disconnect();
    });

    process.once('SIGTERM', () => {
      logger.info('SIGTERM received, shutting down...');
      bot.stop('SIGTERM');
      prisma.$disconnect();
    });

  } catch (error) {
    logger.error('Failed to start bot:', error);
    process.exit(1);
  }
}

// Start the bot
startBot();

export { bot };
