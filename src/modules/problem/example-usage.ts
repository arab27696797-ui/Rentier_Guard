/**
 * Пример использования модуля работы с проблемами
 * RentierGuard Bot
 */

import { Telegraf, Scenes, session, Markup } from 'telegraf';
import { PrismaClient } from '@prisma/client';
import {
  // Сцены
  problemScenesArray,
  initializeProblemModule,
  problemCommands,
  
  // Сервисы
  getProblemScenario,
  generateClaimText,
  addToBadTenant,
  getUserBadTenants,
  
  // Типы
  ProblemType,
  BadTenantReason,
  
  // Сообщения
  problemMenuMessage,
} from './index';

// ============================================
// ИНИЦИАЛИЗАЦИЯ
// ============================================

const BOT_TOKEN = process.env.BOT_TOKEN || 'your-bot-token';
const prisma = new PrismaClient();

// Инициализируем модуль проблем
initializeProblemModule(prisma);

// Создаём бота
const bot = new Telegraf<Scenes.WizardContext>(BOT_TOKEN);

// Подключаем сессии
bot.use(session());

// Создаём и подключаем stage со сценами
const stage = new Scenes.Stage(problemScenesArray);
bot.use(stage.middleware());

// ============================================
// КОМАНДЫ
// ============================================

/**
 * Команда /start - главное меню
 */
bot.command('start', async (ctx) => {
  const welcomeMessage = `
🏠 <b>Добро пожаловать в RentierGuard!</b>

Ваш помощник в управлении арендной недвижимостью.

<b>Доступные команды:</b>

/property — Управление объектами
/tenant — Управление арендаторами  
/payment — Контроль платежей
🔴 <b>/problem</b> — Решение проблем
🚫 <b>/bad_tenant</b> — Чёрный список
/documents — Документы
/reminder — Напоминания
/settings — Настройки
/help — Помощь
  `;

  await ctx.reply(welcomeMessage, { parse_mode: 'HTML' });
});

/**
 * Команда /problem - вход в мастер проблем
 */
bot.command('problem', async (ctx) => {
  await ctx.scene.enter('problem-wizard');
});

/**
 * Команда /bad_tenant - управление чёрным списком
 */
bot.command('bad_tenant', async (ctx) => {
  await ctx.scene.enter('bad-tenant');
});

/**
 * Команда /claim - быстрая генерация претензии
 */
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

/**
 * Команда /court_help - помощь по судебным вопросам
 */
bot.command('court_help', async (ctx) => {
  await ctx.reply(
    '⚖️ <b>Помощь по судебным вопросам</b>\n\n' +
    'Выберите раздел:',
    {
      parse_mode: 'HTML',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('📋 Подача иска', 'court:file_claim')],
        [Markup.button.callback('📄 Необходимые документы', 'court:documents')],
        [Markup.button.callback('💰 Госпошлина', 'court:fee')],
        [Markup.button.callback('⏱ Сроки', 'court:deadlines')],
        [Markup.button.callback('🤝 Мирное урегулирование', 'court:peaceful')],
      ]),
    }
  );
});

// ============================================
// INLINE ОБРАБОТЧИКИ
// ============================================

// Быстрая генерация претензии
bot.action(/quick_claim:(.+)/, async (ctx) => {
  const type = ctx.match[1];
  
  if (type === 'cancel') {
    await ctx.answerCbQuery('Отменено');
    await ctx.deleteMessage();
    return;
  }
  
  await ctx.answerCbQuery('Переходим в мастер...');
  await ctx.deleteMessage();
  
  // Можно передать параметр в сцену через session
  ctx.session = {
    ...ctx.session,
    quickClaimType: type,
  };
  
  await ctx.scene.enter('problem-wizard');
});

// ============================================
// ПРИМЕР РАБОТЫ С СЕРВИСАМИ НАПРЯМУЮ
// ============================================

/**
 * Пример: Получение сценария решения проблемы
 */
async function exampleGetScenario() {
  const scenario = getProblemScenario(ProblemType.NON_PAYMENT);
  
  console.log('Сценарий:', scenario.title);
  console.log('Описание:', scenario.description);
  console.log('Шаги:', scenario.steps.length);
  
  scenario.steps.forEach((step) => {
    console.log(`${step.order}. ${step.title}`);
    console.log(`   ${step.description}`);
  });
}

/**
 * Пример: Генерация претензии
 */
async function exampleGenerateClaim() {
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
    console.log('Содержание:', result.claim.content.substring(0, 500) + '...');
  } else {
    console.error('Ошибка:', result.error);
  }
}

/**
 * Пример: Добавление в чёрный список
 */
async function exampleAddToBadTenant(userId: string) {
  const result = await addToBadTenant({
    userId,
    fullName: 'Сидоров Сидор Сидорович',
    passportData: '4515 123456',
    phoneNumber: '+79161234567',
    reason: BadTenantReason.NON_PAYMENT,
    description: 'Не платил аренду с января по март 2024. Задолженность 150000 руб. Игнорировал все предупреждения.',
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

/**
 * Пример: Получение списка проблемных арендаторов
 */
async function exampleGetBadTenants(userId: string) {
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
  ctx.reply('❌ Произошла ошибка. Попробуйте позже или обратитесь в поддержку.');
});

// ============================================
 * ЗАПУСК БОТА
// ============================================

async function startBot() {
  try {
    // Проверяем подключение к базе
    await prisma.$connect();
    console.log('✅ Подключено к базе данных');
    
    // Запускаем бота
    await bot.launch();
    console.log('🤖 Бот запущен');
    
    // Graceful shutdown
    process.once('SIGINT', () => {
      bot.stop('SIGINT');
      prisma.$disconnect();
    });
    process.once('SIGTERM', () => {
      bot.stop('SIGTERM');
      prisma.$disconnect();
    });
  } catch (error) {
    console.error('Ошибка запуска:', error);
    process.exit(1);
  }
}

// Запускаем
startBot();

// ============================================
// ЭКСПОРТ ДЛЯ ТЕСТИРОВАНИЯ
// ============================================

export {
  bot,
  prisma,
  exampleGetScenario,
  exampleGenerateClaim,
  exampleAddToBadTenant,
  exampleGetBadTenants,
};
