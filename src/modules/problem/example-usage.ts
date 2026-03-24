/**
 * Пример использования модуля работы с проблемами
 * RentierGuard Bot
 *
 * Этот файл предназначен только для демонстрации.
 * Он не должен автоматически запускаться при обычной сборке приложения.
 */

import { Telegraf, Scenes, session, Markup } from 'telegraf';
import { PrismaClient } from '@prisma/client';
import {
  problemScenesArray,
  initializeProblemModule,
  getProblemScenario,
  generateClaimText,
  addToBadTenant,
  getUserBadTenants,
  ProblemType,
  BadTenantReason,
} from './index';

// ============================================
// ИНИЦИАЛИЗАЦИЯ
// ============================================

const BOT_TOKEN = process.env.BOT_TOKEN || 'your-bot-token';
const prisma = new PrismaClient();

initializeProblemModule(prisma);

// Используем any, так как это демонстрационный файл, а не production entrypoint
const bot = new Telegraf<any>(BOT_TOKEN);

bot.use(session());

const stage = new Scenes.Stage<any>(problemScenesArray);
bot.use(stage.middleware());

// ============================================
// КОМАНДЫ
// ============================================

bot.command('start', async (ctx) => {
  const welcomeMessage =
    '🏠 <b>Добро пожаловать в RentierGuard!</b>\n\n' +
    'Ваш помощник в управлении арендной недвижимостью.\n\n' +
    '<b>Доступные команды:</b>\n\n' +
    '/property — Управление объектами\n' +
    '/tenant — Управление арендаторами\n' +
    '/payment — Контроль платежей\n' +
    '🔴 <b>/problem</b> — Решение проблем\n' +
    '🚫 <b>/bad_tenant</b> — Чёрный список\n' +
    '/documents — Документы\n' +
    '/reminder — Напоминания\n' +
    '/settings — Настройки\n' +
    '/help — Помощь';

  await ctx.reply(welcomeMessage, { parse_mode: 'HTML' });
});

bot.command('problem', async (ctx) => {
  await (ctx as any).scene.enter('problem-wizard');
});

bot.command('bad_tenant', async (ctx) => {
  await (ctx as any).scene.enter('bad-tenant');
});

bot.command('claim', async (ctx) => {
  await ctx.reply(
    '📝 <b>Быстрая генерация претензии</b>\n\nВыберите тип претензии:',
    {
      parse_mode: 'HTML',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('💰 Неуплата аренды', 'quick_claim:non_payment')],
        [Markup.button.callback('🔨 Повреждение имущества', 'quick_claim:damage')],
        [Markup.button.callback('🚪 Выезд без оплаты', 'quick_claim:eviction')],
        [Markup.button.callback('📄 Расторжение договора', 'quick_claim:termination')],
        [Markup.button.callback('❌ Отмена', 'quick_claim:cancel')],
      ]),
    }
  );
});

bot.command('court_help', async (ctx) => {
  await ctx.reply('⚖️ <b>Помощь по судебным вопросам</b>\n\nВыберите раздел:', {
    parse_mode: 'HTML',
    ...Markup.inlineKeyboard([
      [Markup.button.callback('📋 Подача иска', 'court:file_claim')],
      [Markup.button.callback('📄 Необходимые документы', 'court:documents')],
      [Markup.button.callback('💰 Госпошлина', 'court:fee')],
      [Markup.button.callback('⏱ Сроки', 'court:deadlines')],
      [Markup.button.callback('🤝 Мирное урегулирование', 'court:peaceful')],
    ]),
  });
});

// ============================================
// INLINE ОБРАБОТЧИКИ
// ============================================

bot.action(/quick_claim:(.+)/, async (ctx) => {
  const match = (ctx as any).match;
  const type = match?.[1];

  if (type === 'cancel') {
    await ctx.answerCbQuery('Отменено');
    await ctx.deleteMessage();
    return;
  }

  await ctx.answerCbQuery('Переходим в мастер...');
  await ctx.deleteMessage();

  (ctx.session as any) = {
    ...(ctx.session || {}),
    quickClaimType: type,
  };

  await (ctx as any).scene.enter('problem-wizard');
});

// ============================================
// ПРИМЕР РАБОТЫ С СЕРВИСАМИ НАПРЯМУЮ
// ============================================

export async function exampleGetScenario(): Promise<void> {
  const scenario = getProblemScenario(ProblemType.NON_PAYMENT);

  console.log('Сценарий:', scenario.title);
  console.log('Описание:', scenario.description);
  console.log('Шаги:', scenario.steps.length);

  scenario.steps.forEach((step) => {
    console.log(`${step.order}. ${step.title}`);
    console.log(`   ${step.description}`);
  });
}

export async function exampleGenerateClaim(): Promise<void> {
  const result = generateClaimText(
    {
      type: ProblemType.NON_PAYMENT,
      debtAmount: 75000,
      delayDays: 20,
      tenantName: 'Петров Петр Петрович',
      contractDate: '15.03.2024',
      propertyAddress: 'г. Москва, ул. Примерная, д. 1, кв. 10',
    },
    ProblemType.NON_PAYMENT
  );

  if (result.success && result.claim) {
    console.log('Претензия сгенерирована!');
    console.log('Заголовок:', result.claim.title);
    console.log('Тип:', result.claim.type);
    console.log('Содержание:', `${result.claim.content.substring(0, 500)}...`);
  } else {
    console.error('Ошибка:', result.error);
  }
}

export async function exampleAddToBadTenant(userId: string): Promise<void> {
  const result = await addToBadTenant({
    userId,
    fullName: 'Сидоров Сидор Сидорович',
    passportData: '4515 123456',
    phoneNumber: '+79161234567',
    reason: BadTenantReason.NON_PAYMENT,
    description:
      'Не платил аренду с января по март 2024. Задолженность 150000 руб. Игнорировал все предупреждения.',
    contractDate: '01.01.2024',
    contractEndDate: '01.04.2024',
    debtAmount: 150000,
  });

  if (result.success) {
    console.log('Добавлено:', result.data?.fullName);
    console.log('Сообщение:', result.message);
  } else {
    console.error('Ошибка:', result.error);
  }
}

export async function exampleGetBadTenants(userId: string): Promise<void> {
  const result = await getUserBadTenants(userId);

  if (result.success && result.data) {
    const tenants = result.data;
    console.log(`Найдено записей: ${tenants.length}`);

    tenants.forEach((tenant, index) => {
      console.log(`${index + 1}. ${tenant.fullName}`);
      console.log(`   Причина: ${tenant.reason}`);
      console.log(`   Добавлен: ${tenant.createdAt?.toLocaleDateString('ru-RU')}`);
    });
  }
}

// ============================================
// ОБРАБОТКА ОШИБОК
// ============================================

bot.catch((err, ctx) => {
  console.error('Bot error:', err);
  void ctx.reply('❌ Произошла ошибка. Попробуйте позже или обратитесь в поддержку.');
});

// ============================================
// ЗАПУСК БОТА
// ============================================

export async function startExampleBot(): Promise<void> {
  try {
    await prisma.$connect();
    console.log('✅ Подключено к базе данных');

    await bot.launch();
    console.log('🤖 Бот запущен');

    process.once('SIGINT', () => {
      bot.stop('SIGINT');
      void prisma.$disconnect();
    });

    process.once('SIGTERM', () => {
      bot.stop('SIGTERM');
      void prisma.$disconnect();
    });
  } catch (error) {
    console.error('Ошибка запуска:', error);
    process.exit(1);
  }
}

// Запускаем только если файл выполнен напрямую
if (require.main === module) {
  void startExampleBot();
}

export { bot, prisma };
