/**
 * RentierGuard Bot - Main Entry Point
 * Годовой комплекс сопровождения рантье
 */

import { Telegraf, Scenes, session } from 'telegraf';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import cron from 'node-cron';

// Load environment variables
dotenv.config();

// Core imports
import { logger } from './core/utils/logger';
import { authMiddleware } from './core/middleware/auth.middleware';
import { errorMiddleware } from './core/middleware/error.middleware';
import { prisma } from './core/services/prisma.service';

// Content imports
import { WELCOME_MESSAGES, MAIN_MENU, ERROR_MESSAGES } from './content/messages';
import { COMMANDS } from './content/commands';

// Module imports
import { taxScenes, initTaxReminders } from './modules/tax';
import { contractScenes } from './modules/contract';
import { propertyScenes } from './modules/property';
import { paymentScenes, initPaymentReminders } from './modules/payment';
import { documentScenes } from './modules/document';
import { rosreestrScenes } from './modules/rosreestr';
import { problemScenes } from './modules/problem';
import { expertScenes } from './modules/expert';
import { findOrCreateUser } from './core/services/user.service';
import { createMainMenu } from './core/utils/keyboard.utils';

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

// Initialize stage with all scenes
const stage = new Scenes.Stage([
  // Tax scenes
  ...taxScenes,
  // Contract scenes
  ...contractScenes,
  // Property scenes
  ...propertyScenes,
  // Payment scenes
  ...paymentScenes,
  // Document scenes
  ...documentScenes,
  // Rosreestr scenes
  ...rosreestrScenes,
  // Problem scenes
  ...problemScenes,
  // Expert scenes
  ...expertScenes,
]);

// Middleware
bot.use(session());
bot.use(stage.middleware());
bot.use(authMiddleware);
bot.use(errorMiddleware);

// ==================== COMMANDS ====================

// /start - Welcome and registration
bot.command('start', async (ctx) => {
  try {
    const telegramUser = ctx.from;
    if (!telegramUser) {
      return ctx.reply(ERROR_MESSAGES.GENERIC_ERROR);
    }

    // Find or create user in database
    const user = await findOrCreateUser({
      telegramId: BigInt(telegramUser.id),
      username: telegramUser.username,
      firstName: telegramUser.first_name,
      lastName: telegramUser.last_name,
    });

    logger.info(`User started bot: ${telegramUser.id} (${telegramUser.username || 'no username'})`);

    const welcomeMessage = WELCOME_MESSAGES.NEW_USER
      .replace('{firstName}', user.firstName || 'Рантье');

    await ctx.reply(welcomeMessage, {
      parse_mode: 'HTML',
      reply_markup: createMainMenu(),
    });
  } catch (error) {
    logger.error('Error in /start command:', error);
    await ctx.reply(ERROR_MESSAGES.GENERIC_ERROR);
  }
});

// /menu - Main menu
bot.command('menu', async (ctx) => {
  await ctx.reply(MAIN_MENU.TITLE, {
    parse_mode: 'HTML',
    reply_markup: createMainMenu(),
  });
});

// ==================== TAX MODULE COMMANDS ====================

bot.command('tax_calc', (ctx) => ctx.scene.enter('tax_calc'));
bot.command('become_selfemployed', (ctx) => ctx.scene.enter('become_selfemployed'));
bot.command('tax_report', (ctx) => ctx.scene.enter('tax_report'));

// ==================== CONTRACT MODULE COMMANDS ====================

bot.command('create_contract', (ctx) => ctx.scene.enter('create_contract'));
bot.command('create_act', (ctx) => ctx.scene.enter('create_act'));
bot.command('create_addendum', (ctx) => ctx.scene.enter('create_addendum'));

// ==================== PROPERTY MODULE COMMANDS ====================

bot.command('add_property', (ctx) => ctx.scene.enter('add_property'));
bot.command('my_properties', (ctx) => ctx.scene.enter('my_properties'));

// ==================== PAYMENT MODULE COMMANDS ====================

bot.command('add_payment', (ctx) => ctx.scene.enter('add_payment'));
bot.command('payment_schedule', (ctx) => ctx.scene.enter('payment_schedule'));

// ==================== ROSREESTR MODULE COMMANDS ====================

bot.command('rosreestr_checklist', (ctx) => ctx.scene.enter('rosreestr_checklist'));
bot.command('find_mfc', (ctx) => ctx.scene.enter('find_mfc'));

// ==================== PROBLEM MODULE COMMANDS ====================

bot.command('problem', (ctx) => ctx.scene.enter('problem'));
bot.command('bad_tenant', (ctx) => ctx.scene.enter('bad_tenant'));

// ==================== EXPERT MODULE COMMANDS ====================

bot.command('expert', (ctx) => ctx.scene.enter('expert'));

// ==================== DOCUMENT MODULE COMMANDS ====================

bot.command('export_year', (ctx) => ctx.scene.enter('export_year'));

// ==================== HELP & INFO COMMANDS ====================

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
• Налоговый калькулятор (сравнение режимов)
• Регистрация самозанятого (пошаговая инструкция)
• Генерация договоров аренды
• Учет объектов и платежей
• Чек-листы для Росреестра
• Решение проблем с арендаторами
• Консультации экспертов

<b>Версия:</b> 1.0.0
<b>Дата обновления:</b> Март 2025

<i>Информация актуальна на март 2025. 
Проверяйте изменения на nalog.gov.ru и rosreestr.gov.ru</i>
  `;

  await ctx.reply(aboutText, { parse_mode: 'HTML' });
});

// ==================== CALLBACK HANDLERS ====================

bot.action('menu_main', async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.editMessageText(MAIN_MENU.TITLE, {
    parse_mode: 'HTML',
    reply_markup: createMainMenu(),
  });
});

bot.action('menu_tax', async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.scene.enter('tax_calc');
});

bot.action('menu_contract', async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.scene.enter('create_contract');
});

bot.action('menu_property', async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.scene.enter('my_properties');
});

bot.action('menu_payment', async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.scene.enter('payment_schedule');
});

bot.action('menu_rosreestr', async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.scene.enter('rosreestr_checklist');
});

bot.action('menu_problem', async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.scene.enter('problem');
});

bot.action('menu_expert', async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.scene.enter('expert');
});

// ==================== ERROR HANDLING ====================

bot.catch((err, ctx) => {
  logger.error(`Error for ${ctx.updateType}:`, err);
  ctx.reply(ERROR_MESSAGES.GENERIC_ERROR);
});

// ==================== CRON JOBS ====================

// Initialize cron jobs
function initCronJobs() {
  // Tax reminders - every day at 9:00
  cron.schedule('0 9 * * *', () => {
    logger.info('Running tax reminders check...');
    initTaxReminders(bot);
  });

  // Payment reminders - every 6 hours
  cron.schedule('0 */6 * * *', () => {
    logger.info('Running payment reminders check...');
    initPaymentReminders(bot);
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
